"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pause, Play } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Button from "@/components/ui/Button";
import { api, ApiError, downloadFile } from "@/lib/api";
import { WebLayoutProvider } from "@/lib/web-layout-context";
import type { PublicHandbook } from "@driving-test-app/shared";

/**
 * Real chapters detected server-side from the PDF's own pages (see
 * HandbookController::detectChapters) — null when the document doesn't use a detectable
 * chapter-marker convention, in which case no chapter panel is shown at all.
 */
type HandbookChapterData = {
  number: number;
  title: string;
  start_page: number;
  text: string;
};

type TrackKind = { type: "document" } | { type: "chapter"; number: number };

type ActiveTrack = {
  kind: TrackKind;
  status: "loading" | "playing" | "paused";
  startedAtMs: number | null;
  accumulatedSeconds: number;
  totalSeconds: number;
};

const CHAPTERS_COLLAPSED_COUNT = 2;
// Standard average TTS/spoken-English rate — used only to *estimate* a track's total length up
// front (like a podcast app shows an episode's length before you press play). Actual playback
// speed varies by browser/voice, so the bar's fill is driven by real elapsed wall-clock time,
// not this estimate — it just sets the denominator.
const WORDS_PER_MINUTE = 150;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function estimateSeconds(wordCount: number): number {
  return (wordCount / WORDS_PER_MINUTE) * 60;
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function sameTrack(a: TrackKind, b: TrackKind): boolean {
  if (a.type !== b.type) return false;
  return a.type === "chapter" && b.type === "chapter" ? a.number === b.number : true;
}

/**
 * Splits into sentence-ish chunks (not one giant utterance) — Chrome is known to silently stop
 * speaking partway through a very long single SpeechSynthesisUtterance.
 */
function splitIntoChunks(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [text])
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

/**
 * A voice-note-style control (play/pause toggle, fill bar, elapsed/total time) — the same look
 * for the whole-document track and each chapter row. Only one track can actually be playing at
 * once (a single browser SpeechSynthesis engine), so `isActive` marks whichever this row is.
 */
function TrackControl({
  isActive,
  status,
  elapsedSeconds,
  totalSeconds,
  onToggle,
}: {
  isActive: boolean;
  status: "idle" | "loading" | "playing" | "paused";
  elapsedSeconds: number;
  totalSeconds: number;
  onToggle: () => void;
}) {
  const percent = totalSeconds > 0 ? Math.min(100, (elapsedSeconds / totalSeconds) * 100) : 0;
  const isPlaying = isActive && status === "playing";
  const isLoading = isActive && status === "loading";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={isLoading}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-opacity hover:bg-blue-700 disabled:opacity-60"
      >
        {isLoading ? (
          <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 translate-x-px" />
        )}
      </button>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
          style={{ width: `${isActive ? percent : 0}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-neutral-500">
        {formatDuration(isActive ? elapsedSeconds : 0)} / {formatDuration(totalSeconds)}
      </span>
    </div>
  );
}

/**
 * Our own real handbook reader — embeds the actual DMV-published PDF via the browser's native
 * PDF viewer. The crawl never captured real handbook text (only a marketing blurb about the
 * source site's download page, plus the genuine PDF file itself), so rendering the PDF directly
 * is the only way to show the real, authentic document rather than the wrong scraped copy.
 * Exists specifically so "Read online" on the state hub's handbook section doesn't have to send users to the
 * driving-tests.org page we crawled it from; we have the real PDF ourselves.
 */
function HandbookReaderPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // The state hub's "Listen" handbook card links here with ?listen=1 so clicking it starts
  // playback immediately instead of landing on the reader and requiring a second click.
  const autoListen = useSearchParams().get("listen") === "1";
  const [handbook, setHandbook] = useState<PublicHandbook | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [speechSupported, setSpeechSupported] = useState(false);
  const [listenError, setListenError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<HandbookChapterData[] | null>(null);
  // From the real extracted PDF text, not handbook.total_words — that field is populated at
  // import time from the crawled `chapters.sections` blurb (confirmed elsewhere to be
  // marketing copy, not the real handbook), so for Alabama it reads 538 while the real PDF is
  // ~29,000 words. Showing 538-word-based minutes for a 90+ page document would be exactly the
  // kind of misleading number this app avoids elsewhere.
  const [documentWordCount, setDocumentWordCount] = useState<number | null>(null);
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [activeTrack, setActiveTrack] = useState<ActiveTrack | null>(null);
  const [, forceTick] = useState(0);

  const chunksRef = useRef<string[]>([]);
  const playbackTokenRef = useRef(0);
  const textFetchRef = useRef<Promise<{ text: string; chapters: HandbookChapterData[] | null }> | null>(null);
  const autoListenTriggeredRef = useRef(false);

  /**
   * Shared by the eager background fetch below and handleToggleDocument — both just await the
   * same in-flight/already-resolved request rather than each firing their own, so opening the
   * page pays the (possibly ~10s+, uncached) real-PDF-parse cost once, and the chapter panel and
   * whole-document track both become available the moment it resolves.
   */
  function fetchHandbookText() {
    if (!textFetchRef.current) {
      textFetchRef.current = api.get<{ text: string; chapters: HandbookChapterData[] | null }>(`/handbooks/${id}/text`);
    }
    return textFetchRef.current;
  }

  useEffect(() => {
    api
      .get<{ handbook: PublicHandbook }>(`/handbooks/${id}`)
      .then((res) => setHandbook(res.handbook))
      .catch((err) => setNotFoundError(err instanceof ApiError ? err.message : "This handbook isn't available."));

    // Fire-and-forget: populates the Chapters panel as soon as it resolves. Failures here are
    // silent — no chapters panel is exactly the same fallback as a document with none detected,
    // and handleToggleDocument surfaces its own error if the user then presses play.
    fetchHandbookText()
      .then((res) => {
        setChapters(res.chapters);
        setDocumentWordCount(countWords(res.text));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id]);

  // Re-renders every 250ms while something is playing so the fill bar and elapsed time — both
  // derived from real Date.now() deltas, not chunk counts — animate smoothly.
  useEffect(() => {
    if (activeTrack?.status !== "playing") return;
    const interval = setInterval(() => forceTick((t) => t + 1), 250);
    return () => clearInterval(interval);
  }, [activeTrack?.status]);

  useEffect(() => {
    if (autoListen && speechSupported && !autoListenTriggeredRef.current) {
      autoListenTriggeredRef.current = true;
      handleToggleDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoListen, speechSupported]);

  async function handleDownload() {
    if (!handbook || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadFile(`/handbooks/${id}/download`, `handbook-${id}.pdf`);
    } catch (err) {
      setDownloadError(err instanceof ApiError ? err.message : "Failed to download the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  function elapsedSecondsFor(track: ActiveTrack): number {
    if (track.startedAtMs === null) return track.accumulatedSeconds;
    return track.accumulatedSeconds + (Date.now() - track.startedAtMs) / 1000;
  }

  /** Read-only view of whichever track `kind` refers to — active or not. */
  function trackInfo(kind: TrackKind): { isActive: boolean; status: ActiveTrack["status"] | "idle"; elapsedSeconds: number } {
    if (!activeTrack || !sameTrack(activeTrack.kind, kind)) {
      return { isActive: false, status: "idle", elapsedSeconds: 0 };
    }
    return { isActive: true, status: activeTrack.status, elapsedSeconds: elapsedSecondsFor(activeTrack) };
  }

  function speakFrom(chunks: string[], index: number, token: number) {
    // A newer startTrack()/cancel() has superseded this run — a stale onend firing after
    // switching tracks must not resurrect the old sequence or step into the new one's chunks.
    if (token !== playbackTokenRef.current) return;
    if (index >= chunks.length) {
      setActiveTrack(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.onend = () => speakFrom(chunks, index + 1, token);
    utterance.onerror = () => {
      if (token !== playbackTokenRef.current) return;
      setActiveTrack(null);
      setListenError("Playback stopped unexpectedly.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function startTrack(kind: TrackKind, text: string, totalSeconds: number) {
    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) {
      setActiveTrack(null);
      setListenError("No readable text was found for this track.");
      return;
    }

    window.speechSynthesis.cancel();
    playbackTokenRef.current += 1;
    const token = playbackTokenRef.current;
    chunksRef.current = chunks;
    setListenError(null);
    setCurrentPage(kind.type === "chapter" ? (chapters?.find((c) => c.number === kind.number)?.start_page ?? null) : null);
    setActiveTrack({ kind, status: "playing", startedAtMs: Date.now(), accumulatedSeconds: 0, totalSeconds });
    speakFrom(chunks, 0, token);
  }

  function togglePause() {
    if (!activeTrack) return;
    if (activeTrack.status === "playing") {
      window.speechSynthesis.pause();
      setActiveTrack({
        ...activeTrack,
        status: "paused",
        accumulatedSeconds: elapsedSecondsFor(activeTrack),
        startedAtMs: null,
      });
    } else if (activeTrack.status === "paused") {
      window.speechSynthesis.resume();
      setActiveTrack({ ...activeTrack, status: "playing", startedAtMs: Date.now() });
    }
  }

  async function handleToggleDocument() {
    const kind: TrackKind = { type: "document" };
    if (activeTrack && sameTrack(activeTrack.kind, kind)) {
      togglePause();
      return;
    }

    setListenError(null);
    setActiveTrack({
      kind,
      status: "loading",
      startedAtMs: null,
      accumulatedSeconds: 0,
      totalSeconds: documentWordCount !== null ? estimateSeconds(documentWordCount) : 0,
    });
    try {
      const res = await fetchHandbookText();
      setChapters(res.chapters);
      const wordCount = countWords(res.text);
      setDocumentWordCount(wordCount);
      startTrack(kind, res.text, estimateSeconds(wordCount));
    } catch (err) {
      setActiveTrack(null);
      setListenError(err instanceof ApiError ? err.message : "Couldn't load the handbook text.");
    }
  }

  function handleToggleChapter(chapter: HandbookChapterData) {
    const kind: TrackKind = { type: "chapter", number: chapter.number };
    if (activeTrack && sameTrack(activeTrack.kind, kind)) {
      togglePause();
      return;
    }
    startTrack(kind, chapter.text, estimateSeconds(countWords(chapter.text)));
  }

  const documentTrack = trackInfo({ type: "document" });
  const documentTotalSeconds = documentTrack.isActive
    ? activeTrack!.totalSeconds
    : documentWordCount !== null
      ? estimateSeconds(documentWordCount)
      : null;
  const visibleChapters = chapters ? (chaptersExpanded ? chapters : chapters.slice(0, CHAPTERS_COLLAPSED_COUNT)) : [];

  return (
    <WebLayoutProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="home" hideNav />
        <main className="flex-1">
          <div className="mx-auto max-w-4xl space-y-4 px-5 py-10 lg:py-14">
            {notFoundError && <p className="text-center text-sm text-destructive">{notFoundError}</p>}
            {!handbook && !notFoundError && <p className="text-center text-sm text-neutral-500">Loading…</p>}

            {handbook && (
              <>
                <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold text-neutral-900">{handbook.title}</h1>
                    {handbook.pdf_url && (
                      <Button onClick={handleDownload} disabled={downloading}>
                        {downloading ? "Preparing PDF…" : "Download PDF"}
                      </Button>
                    )}
                  </div>
                  {speechSupported && documentTotalSeconds !== null && (
                    <TrackControl
                      isActive={documentTrack.isActive}
                      status={documentTrack.status}
                      elapsedSeconds={documentTrack.elapsedSeconds}
                      totalSeconds={documentTotalSeconds}
                      onToggle={handleToggleDocument}
                    />
                  )}
                  {speechSupported && documentTotalSeconds === null && (
                    <p className="text-xs text-neutral-500">Preparing audio…</p>
                  )}
                </div>
                {listenError && <p className="text-sm text-destructive">{listenError}</p>}
                {downloadError && <p className="text-sm text-destructive">{downloadError}</p>}

                {chapters && chapters.length > 0 && (
                  <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold text-neutral-900">Chapters</h2>
                    <ul className="divide-y divide-gray-100">
                      {visibleChapters.map((chapter) => {
                        const info = trackInfo({ type: "chapter", number: chapter.number });
                        return (
                          <li key={chapter.number} className="space-y-2 py-3">
                            <button
                              type="button"
                              onClick={() => setCurrentPage(chapter.start_page)}
                              className="block truncate text-left text-sm font-medium text-neutral-700 hover:text-blue-700"
                            >
                              {chapter.number}. {chapter.title}
                            </button>
                            {speechSupported && (
                              <TrackControl
                                isActive={info.isActive}
                                status={info.status}
                                elapsedSeconds={info.elapsedSeconds}
                                totalSeconds={estimateSeconds(countWords(chapter.text))}
                                onToggle={() => handleToggleChapter(chapter)}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {chapters.length > CHAPTERS_COLLAPSED_COUNT && (
                      <button
                        type="button"
                        onClick={() => setChaptersExpanded((expanded) => !expanded)}
                        className="mt-3 text-sm font-medium text-blue-700 hover:underline"
                      >
                        {chaptersExpanded ? "Show less" : `Show more (${chapters.length - CHAPTERS_COLLAPSED_COUNT})`}
                      </button>
                    )}
                  </div>
                )}

                {handbook.pdf_url ? (
                  <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <iframe
                      src={currentPage ? `${handbook.pdf_url}#page=${currentPage}` : handbook.pdf_url}
                      title={handbook.title}
                      className="h-[85vh] w-full"
                    />
                  </div>
                ) : (
                  <p className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
                    No PDF is available for this handbook yet.
                  </p>
                )}
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </WebLayoutProvider>
  );
}

export default function HandbookReaderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <HandbookReaderPageInner params={params} />
    </Suspense>
  );
}
