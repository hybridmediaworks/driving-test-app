<?php

namespace App\Actions\CheatSheet;

use App\Models\CheatSheet;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\CommonMark\CommonMarkConverter;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class GenerateCheatSheetPdf
{
    public function __construct(
        private readonly CommonMarkConverter $markdown,
    ) {}

    /**
     * Lazily renders and caches the cheat sheet's PDF — returns the existing cached file if
     * `SyncCheatSheetSections` hasn't cleared it since the last render (i.e. content hasn't
     * changed), otherwise renders fresh from current sections and caches the result.
     */
    public function __invoke(CheatSheet $cheatSheet): Media
    {
        // A cached row can outlive its file — e.g. local storage was cleared, or the row was seeded
        // without the binary (which otherwise 500s the download on a missing file). Trust the cache
        // only when the file is actually present on its disk; otherwise fall through and re-render.
        // The PDF collection is singleFile, so re-rendering replaces the dangling row automatically.
        $cached = $cheatSheet->cachedPdfMedia();
        if ($cached !== null && Storage::disk($cached->disk)->exists($cached->getPathRelativeToRoot())) {
            return $cached;
        }

        $cheatSheet->loadMissing('sections');

        $sections = $cheatSheet->sections->map(fn ($section) => [
            'heading' => $section->heading,
            'html' => (string) $this->markdown->convert($section->body_markdown),
        ]);

        $html = view('pdf.cheat-sheet', [
            'cheatSheet' => $cheatSheet,
            'sections' => $sections,
        ])->render();

        $pdf = Pdf::loadHTML($html)->setPaper('letter');

        // Use toMediaCollection()'s own return value rather than re-querying via
        // cachedPdfMedia() — the model's `media` relation was already loaded (as empty) by the
        // check above, so a second lookup on the same instance would return that stale, cached
        // empty result instead of the row just created.
        return $cheatSheet
            ->addMediaFromString($pdf->output())
            ->usingFileName(Str::slug($cheatSheet->title).'.pdf')
            ->toMediaCollection(CheatSheet::MEDIA_COLLECTION_PDF);
    }
}
