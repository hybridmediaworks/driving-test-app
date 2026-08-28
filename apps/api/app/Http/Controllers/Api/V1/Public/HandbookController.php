<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Public\HandbookResource;
use App\Models\Handbook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser as PdfParser;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class HandbookController extends Controller
{
    /**
     * List handbooks
     *
     * Public — no authentication required. Optionally filter by `state` (state code) and
     * `vehicle_type` (name) — unlike quizzes/cheat-sheets/videos, both are exact-match only, no
     * "null = applies universally" fallback, since every real handbook belongs to exactly one
     * state and vehicle type.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $query = Handbook::query()
            ->with(['state', 'vehicleType'])
            ->orderBy('title');

        if ($request->filled('state')) {
            $code = $request->string('state')->toString();
            $query->whereHas('state', fn ($q) => $q->where('code', $code));
        }

        if ($request->filled('vehicle_type')) {
            $name = $request->string('vehicle_type')->toString();
            $query->whereHas('vehicleType', fn ($q) => $q->where('name', $name));
        }

        return HandbookResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Show a handbook
     *
     * Public — no authentication required. Includes chapters/sections directly — not premium
     * gated (see HandbookResource).
     */
    public function show(Handbook $handbook): JsonResponse
    {
        $handbook->load(['state', 'vehicleType', 'chapters.sections']);

        return response()->json(['handbook' => new HandbookResource($handbook)]);
    }

    /**
     * Download a handbook's PDF
     *
     * Public — no authentication required, same as show(). Returns the real, DMV-published PDF
     * file with a Content-Disposition that forces a save-to-disk rather than the browser's
     * inline PDF viewer (which is what a bare link to the media URL triggers).
     */
    public function download(Handbook $handbook): BinaryFileResponse
    {
        $media = $handbook->getFirstMedia(Handbook::MEDIA_COLLECTION_PDF);
        abort_if($media === null, 404);

        return response()->download($media->getPath(), Str::slug($handbook->title).'.pdf');
    }

    /**
     * Extract a handbook's real text, plus real chapters where detectable
     *
     * Public — no authentication required. Powers the "Listen" (browser text-to-speech) feature
     * — extracted live from the real PDF's embedded text layer rather than the crawled
     * `chapters.sections` data, which is only a marketing blurb about the source site's download
     * page, not the authentic handbook content (see HandbookReaderPage's doc comment). Cached by
     * media ID (real-world parse time for a full handbook PDF measured over 10s, too slow to
     * redo on every click) — `singleFile()` gives a replaced PDF a new media row, so this
     * invalidates itself automatically on re-upload with no manual cache-clearing needed.
     */
    public function text(Handbook $handbook): JsonResponse
    {
        $media = $handbook->getFirstMedia(Handbook::MEDIA_COLLECTION_PDF);
        abort_if($media === null, 404);

        $data = Cache::rememberForever("handbook-parsed:{$media->id}", function () use ($media) {
            $pdf = (new PdfParser())->parseFile($media->getPath());

            // Extract each page's text exactly once — getText() re-walks every page under the
            // hood, and calling it again per-page for chapter detection measured at roughly
            // double the one-time parse cost (~13s -> ~29s) for a full handbook PDF.
            $pageTexts = array_map(
                fn (?\Smalot\PdfParser\Page $page) => $page === null ? '' : trim($page->getText()),
                $pdf->getPages()
            );
            $text = implode("\n\n", array_filter($pageTexts, fn (string $t) => $t !== ''));

            return [
                'text' => $text,
                'chapters' => $this->detectChapters($pageTexts, $text),
            ];
        });

        return response()->json($data);
    }

    /**
     * Best-effort real chapter detection from the PDF's own pages — no PDF outline/bookmark
     * support exists in smalot/pdfparser, so this looks for a bare, all-caps "CHAPTER n" marker
     * on each page (verified against a real 92-page handbook: 9 exact hits, zero false
     * positives, correctly excludes the mixed-case "Chapter n" mentions on the real Table of
     * Contents page). Real titles come from that same ToC's "Chapter n - Title" lines. Returns
     * null rather than a partial/fabricated result when the document doesn't use this
     * convention at all (verified against a second real handbook with zero matches) — the
     * frontend falls back to the whole-document experience in that case.
     *
     * @param  list<string>  $pageTexts
     * @return list<array{number: int, title: string, start_page: int, text: string}>|null
     */
    private function detectChapters(array $pageTexts, string $fullText): ?array
    {
        $starts = [];
        foreach ($pageTexts as $index => $pageText) {
            if (preg_match('/\bCHAPTER\s+(\d+)\b/', $pageText, $matches) === 1) {
                $number = (int) $matches[1];
                if (! isset($starts[$number])) {
                    $starts[$number] = $index;
                }
            }
        }

        if (count($starts) < 2) {
            return null;
        }

        ksort($starts);
        $previousPage = -1;
        foreach ($starts as $page) {
            if ($page <= $previousPage) {
                return null;
            }
            $previousPage = $page;
        }

        $titles = [];
        if (preg_match_all('/Chapter\s+(\d+)\s*[-–]\s*(.+)/u', $fullText, $matches, PREG_SET_ORDER) !== false) {
            foreach ($matches as $match) {
                $number = (int) $match[1];
                if (! isset($titles[$number])) {
                    $titles[$number] = trim(preg_replace('/\s+/', ' ', $match[2]));
                }
            }
        }

        $numbers = array_keys($starts);
        $chapters = [];
        foreach ($numbers as $position => $number) {
            $startPage = $starts[$number];
            $nextNumber = $numbers[$position + 1] ?? null;
            $endPage = $nextNumber !== null ? $starts[$nextNumber] : count($pageTexts);

            $chapterText = '';
            for ($p = $startPage; $p < $endPage; $p++) {
                $chapterText .= $pageTexts[$p]."\n";
            }

            $chapters[] = [
                'number' => $number,
                'title' => $titles[$number] ?? "Chapter {$number}",
                'start_page' => $startPage + 1,
                'text' => trim($chapterText),
            ];
        }

        return $chapters;
    }
}
