"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Flag, Gem, LogOut, RotateCcw, Settings } from "lucide-react";
import type {
  AmbientTrack,
  PublicQuiz,
  PublicQuizQuestion,
  QuizAnswerCheckResponse,
  QuizAttempt,
  QuizShowResponse,
} from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import Slider from "@/components/ui/Slider";
import Switch from "@/components/ui/Switch";
import QuestionCard from "@/components/state/quiz/QuestionCard";
import HintPanel from "@/components/state/quiz/HintPanel";
import RestartDialog from "@/components/state/quiz/RestartDialog";
import StreakBadge from "@/components/state/quiz/StreakBadge";
import ReportMistakeDialog from "@/components/state/quiz/ReportMistakeDialog";
import Toast, { type ToastVariant } from "@/components/state/quiz/Toast";
import QuizResults from "@/components/state/quiz/QuizResults";
import { api, ApiError } from "@/lib/api";
import { useEntitlement } from "@/lib/auth-context";

const allowedToFail = 4;

// Fisher-Yates shuffle (returns a new array; never mutates the input).
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Randomize the question order for a fresh attempt. Grading is unaffected — the client always
// sends the real answer id, and the correct-answer reveal is matched by id, not display position.
function shuffleQuiz(questions: PublicQuizQuestion[]): PublicQuizQuestion[] {
  return shuffle(questions);
}

function loadStoredFlags(quizId: number): Set<number> {
  try {
    const raw = localStorage.getItem(`quiz-flags-${quizId}`);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * The practice-mode quiz-taking screen shared by every entry point that lets a learner take a
 * quiz outside the timed exam simulator (state-scoped test pages, and the standalone
 * `/quizzes/[id]` route): top bar with exit/upgrade, question + hint panel, live progress sidebar,
 * and the results screen. Callers own resolving `quiz`/`data`/`locked` (the lookup differs per
 * route) and where "exit", "not found", and "continue" should navigate to.
 *
 * This component only gates on load/not-found/locked/empty state; the actual interactive
 * quiz-taking state lives in `QuizTaker` below, which mounts fresh (via `key={quiz.id}`) only once
 * a real, unlocked, non-empty quiz is available — so its per-attempt state (shuffle order, flags,
 * answers) can initialize directly from props instead of syncing to them after the fact.
 */
export default function QuizExperience({
  quiz,
  data,
  locked,
  loadError,
  title,
  notFoundHref,
  notFoundLabel,
  exitHref,
  stateName = "",
  stateCode = "",
  onContinue,
}: {
  quiz: PublicQuiz | null | undefined;
  data: QuizShowResponse | null;
  locked: boolean;
  loadError?: string | null;
  title: string;
  notFoundHref: string;
  notFoundLabel: string;
  exitHref: string;
  stateName?: string;
  stateCode?: string;
  onContinue: () => void | Promise<void>;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 relative">
        {quiz === undefined ? (
          <Paragraph className="py-20 text-center" color="muted">
            Loading test…
          </Paragraph>
        ) : quiz === null ? (
          <div className="py-20 text-center space-y-4">
            <Paragraph color="muted">{loadError ?? "This test isn't available right now."}</Paragraph>
            <Button href={notFoundHref}>{notFoundLabel}</Button>
          </div>
        ) : locked ? (
          <div className="py-20 text-center space-y-4">
            <Paragraph color="muted">
              This test is a premium test. Upgrade to unlock it.
            </Paragraph>
            <Button href="/pricing">
              <Gem className="w-5" /> Upgrade to Premium
            </Button>
          </div>
        ) : !data?.questions || data.questions.length === 0 ? (
          <Paragraph className="py-20 text-center" color="muted">
            This test doesn&apos;t have any questions yet.
          </Paragraph>
        ) : (
          <QuizTaker
            key={quiz.id}
            quiz={quiz}
            questions={data.questions}
            title={title}
            exitHref={exitHref}
            stateName={stateName}
            stateCode={stateCode}
            onContinue={onContinue}
          />
        )}
      </main>
    </div>
  );
}

function QuizTaker({
  quiz,
  questions,
  title,
  exitHref,
  stateName,
  stateCode,
  onContinue,
}: {
  quiz: PublicQuiz;
  questions: PublicQuizQuestion[];
  title: string;
  exitHref: string;
  stateName: string;
  stateCode: string;
  onContinue: () => void | Promise<void>;
}) {
  const { isPremium } = useEntitlement();

  const [showResults, setShowResults] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  // Questions are shuffled per attempt (re-shuffled on Restart via `restart()` below).
  const [loadedQuestions, setLoadedQuestions] = useState<PublicQuizQuestion[]>(() => shuffleQuiz(questions));

  // Practice mode: each answered question is graded immediately via the check endpoint.
  const [checkedByQuestionId, setCheckedByQuestionId] = useState<Record<number, QuizAnswerCheckResponse>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(() => loadStoredFlags(quiz.id));
  const [progressFilter, setProgressFilter] = useState<"all" | "correct" | "incorrect" | "flagged">("all");

  // Consecutive-correct streak. The ref is read synchronously inside the async grade handler;
  // `streak` state drives the live badge in the bottom bar.
  const streakRef = useRef(0);
  const [streak, setStreak] = useState(0);

  const [hintOpen, setHintOpen] = useState(true);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const [voiceOver, setVoiceOver] = useState(false);
  const [answerPopularity, setAnswerPopularity] = useState(false);
  const [ambientMusic, setAmbientMusic] = useState(false);
  const [ambientTrack, setAmbientTrack] = useState<number | null>(null);
  const [ambientTracks, setAmbientTracks] = useState<AmbientTrack[]>([]);
  const [fontSize, setFontSize] = useState([50]);
  const [language, setLanguage] = useState<"en" | "es" | "ru">("en");

  // The track list (admin-managed, category-scoped) and each track's S3 URL are server-resolved,
  // not hardcoded — same disk/URL-resolution convention the API already uses for
  // Video/QuizQuestionAsset. Scoped to this quiz's own category, which is stable for the
  // lifetime of this mounted QuizTaker (the parent remounts it via key={quiz.id}).
  useEffect(() => {
    let cancelled = false;
    const categoryQuery = quiz.category?.name ? `?category=${encodeURIComponent(quiz.category.name)}` : "";
    api
      .get<{ tracks: AmbientTrack[] }>(`/ambient-tracks${categoryQuery}`)
      .then((res) => {
        if (cancelled) return;
        setAmbientTracks(res.tracks);
        setAmbientTrack((prev) => prev ?? res.tracks[0]?.id ?? null);
      })
      .catch(() => {
        // No ambient-track data available (offline, API error) — the settings row below already
        // hides the picker when the list is empty, so this just leaves it that way.
      });
    return () => {
      cancelled = true;
    };
  }, [quiz.category?.name]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Loop the selected ambient track while enabled. Session-level (not per-question) so it keeps
  // playing across question navigation instead of restarting. The URL is server-resolved (S3),
  // so it's null until `ambientTracks` has loaded or if the API's bucket isn't configured — a
  // missing/broken file fails silently via `onError` below rather than leaving a stuck attempt.
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackUrl = ambientTracks.find((t) => t.id === ambientTrack)?.url ?? null;

  useEffect(() => {
    const audio = ambientAudioRef.current;
    if (!audio) return;

    if (ambientMusic && currentTrackUrl) {
      audio.volume = 0.35;
      audio.play().catch(() => {
        // Autoplay can still be blocked in some browsers even from a user-gesture-triggered
        // toggle — degrade silently rather than surfacing a broken play button.
      });
    } else {
      audio.pause();
    }

    return () => audio.pause();
  }, [ambientMusic, currentTrackUrl]);

  const isViewingFurthest = currentIndex === furthestIndex;
  const currentQuestion = loadedQuestions[currentIndex];
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isAnswered = selectedOptionId !== undefined;

  const questionFontScale = useMemo(() => 0.85 + (fontSize[0] / 100) * 0.45, [fontSize]);

  // Correctness is unknown client-side until the attempt is graded server-side — these only
  // become meaningful once `attempt` exists (post-submission).
  const gradedByQuestionId = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const a of attempt?.answers ?? []) map.set(a.question_id, a.is_correct);
    return map;
  }, [attempt]);

  function questionStatus(questionId: number): "correct" | "incorrect" | "unanswered" {
    if (!gradedByQuestionId.has(questionId)) return "unanswered";
    return gradedByQuestionId.get(questionId) ? "correct" : "incorrect";
  }

  const questionStatuses = loadedQuestions.map((q) => questionStatus(q.id));

  // Live sidebar counts come from instant-feedback grading, not the (post-submit) attempt.
  const currentCheck = currentQuestion ? checkedByQuestionId[currentQuestion.id] : undefined;
  const correctCount = loadedQuestions.filter((q) => checkedByQuestionId[q.id]?.is_correct === true).length;
  const incorrectCount = loadedQuestions.filter((q) => checkedByQuestionId[q.id]?.is_correct === false).length;
  const flaggedCount = loadedQuestions.filter((q) => flaggedIds.has(q.id)).length;

  async function selectOption(optionId: number) {
    if (!currentQuestion) return;
    // Once a question is graded it's locked — the reveal is final.
    if (checkedByQuestionId[currentQuestion.id]) return;
    const questionId = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    try {
      const res = await api.post<QuizAnswerCheckResponse>(
        `/quizzes/${quiz.id}/questions/${questionId}/check`,
        { answer_id: optionId },
      );
      setCheckedByQuestionId((prev) => ({ ...prev, [questionId]: res }));

      // Update the consecutive-correct streak (drives the bottom-bar badge).
      if (res.is_correct) {
        streakRef.current += 1;
        setStreak(streakRef.current);
      } else {
        streakRef.current = 0;
        setStreak(0);
      }
    } catch {
      // Grading failed (e.g. network) — keep the selection so the learner can retry by re-tapping.
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  }

  function toggleFlag() {
    if (!currentQuestion) return;
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  }

  function goToQuestion(index: number) {
    if (index > furthestIndex) return;
    setCurrentIndex(index);
  }

  function nextQuestion() {
    if (currentIndex < loadedQuestions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      if (next > furthestIndex) setFurthestIndex(next);
    }
  }

  function previousQuestion() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }

  function restart() {
    setAnswers({});
    setCurrentIndex(0);
    setFurthestIndex(0);
    setShowResults(false);
    setAttempt(null);
    setCheckedByQuestionId({});
    streakRef.current = 0;
    setStreak(0);
    // Re-shuffle questions for the new attempt.
    setLoadedQuestions(shuffleQuiz(questions));
  }

  async function submitAttempt() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.post<{ attempt: QuizAttempt }>(`/quizzes/${quiz.id}/attempts`, {
        answers: Object.entries(answers).map(([questionId, answerId]) => ({
          question_id: Number(questionId),
          answer_id: answerId,
        })),
        duration_seconds: Math.round((Date.now() - startedAt) / 1000),
      });
      setAttempt(res.attempt);
      setShowResults(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to submit your answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function viewQuestion(index: number) {
    setShowResults(false);
    setCurrentIndex(index);
  }

  // Persist flag marks per-quiz so they survive reloads within this browser.
  useEffect(() => {
    try {
      localStorage.setItem(`quiz-flags-${quiz.id}`, JSON.stringify([...flaggedIds]));
    } catch {
      // ignore quota / private-mode errors
    }
  }, [flaggedIds, quiz.id]);

  // Auto-dismiss the success toast.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (showResults) {
    return (
      <QuizResults
        quizName={title}
        results={questionStatuses.map((s) => s === "correct")}
        showUpsell={!isPremium}
        stateName={stateName}
        stateCode={stateCode}
        onRetry={restart}
        onContinue={onContinue}
        onSelectQuestion={viewQuestion}
      />
    );
  }

  return (
    <>
      <audio
        ref={ambientAudioRef}
        src={currentTrackUrl ?? undefined}
        loop
        preload="none"
        onError={(e) => {
          // Switching tracks aborts whatever the element was still loading, which itself fires
          // an `error` event with code MEDIA_ERR_ABORTED (1) — not a real failure, just the
          // browser cancelling the old track's in-flight load. Only a genuine load/decode error
          // (network failure, missing file, unsupported format) should disable the toggle.
          const code = e.currentTarget.error?.code;
          if (code && code !== MediaError.MEDIA_ERR_ABORTED) setAmbientMusic(false);
        }}
        className="hidden"
      />
      <div className="bg-white sticky top-0 z-90">
        <div className="max-w-container lg:mx-auto mx-5  flex items-center justify-between gap-3 py-3.5">
          <Button href={exitHref} variant="ghost" className=" text-neutral-700 p-0!" size="sm">
            <LogOut className="w-5 h-5 text-neutral-500" />
            Exit
          </Button>
          <div className="flex shrink-0 items-center justify-center gap-4">
            <Paragraph
              size="sm"
              color="primary"
              className="hidden md:block rounded-full border border-blue-300 bg-blue-50 px-3 py-0.5 font-semibold"
            >
              ✦ Practice
            </Paragraph>
            <Paragraph size="sm" color="dark" className=" font-semibold">
              {title}
            </Paragraph>
          </div>
          <Button href="/pricing" size="sm" variant="gold">
            <Gem className="w-5" /> Upgrade
          </Button>
        </div>
        <div className="h-2.5 flex-1 overflow-hidden bg-background2">
          <div
            className="h-2.5 bg-linear-to-r rounded-tr-2xl rounded-br-2xl from-blue-500 to-blue-700 transition-all"
            style={{
              width: loadedQuestions.length ? `${((currentIndex + 1) / loadedQuestions.length) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      <section className="pt-6 lg:pt-15 pb-35 px-5">
        <div className="max-w-container mx-auto grid lg:grid-cols-3 grid-cols-1 gap-4">
          <div className="lg:col-span-2 p-5 lg:p-8 rounded-3xl border border-border bg-white shadow-[0_20px_50px_-26px_rgba(23,37,84,0.25)] space-y-4">
            <div className="flex items-center justify-between gap-1 ">
              <div className="flex items-center sm:gap-4 gap-2 flex-wrap">
                <Paragraph size="sm" color="primary" className=" rounded-full  bg-blue-50 px-3 py-1 font-semibold">
                  {currentQuestion.topic ?? quiz.category?.title ?? "General"}
                </Paragraph>
                <Paragraph size="sm">
                  <strong>Questions</strong> {currentIndex + 1}/{loadedQuestions.length}
                </Paragraph>
              </div>
              <div className="flex sm:gap-3 gap-2 items-center justify-center">
                <Bookmark
                  onClick={toggleFlag}
                  className={`h-6 w-6 cursor-pointer ${
                    currentQuestion && flaggedIds.has(currentQuestion.id)
                      ? "fill-amber-400 text-amber-500"
                      : "text-neutral-500"
                  }`}
                />
                <div className="relative" ref={settingsRef}>
                  <Settings onClick={() => setSettingsOpen((v) => !v)} className="h-6 w-6 cursor-pointer text-neutral-500" />

                  {settingsOpen && (
                    <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-lg border bg-white p-3 shadow-lg">
                      <div className="flex items-center justify-between py-1.5">
                        <Paragraph size="sm" color="dark">
                          Voice over
                        </Paragraph>
                        <Switch checked={voiceOver} onCheckedChange={setVoiceOver} />
                      </div>
                      <hr className="my-1 border-border" />
                      <div className="flex items-center justify-between py-1.5">
                        <Paragraph size="sm" color="dark">
                          Answer popularity
                        </Paragraph>
                        <Switch checked={answerPopularity} onCheckedChange={setAnswerPopularity} />
                      </div>
                      <hr className="my-1 border-border" />
                      <div className="flex items-center justify-between py-1.5">
                        <Paragraph size="sm" color="dark">
                          Ambient music
                        </Paragraph>
                        <Switch checked={ambientMusic} onCheckedChange={setAmbientMusic} />
                      </div>
                      {ambientMusic && ambientTracks.length > 0 && (
                        <div className="pb-1.5">
                          <select
                            value={ambientTrack ?? ""}
                            onChange={(e) => setAmbientTrack(Number(e.target.value))}
                            className="w-full rounded-full bg-neutral-100 px-3 py-2 text-sm"
                          >
                            {ambientTracks.map((track) => (
                              <option key={track.id} value={track.id}>
                                {track.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <hr className="my-1 border-border" />
                      <div className="py-1.5">
                        <div className="mb-2 flex items-center justify-between">
                          <Paragraph size="sm" color="dark">
                            Font size
                          </Paragraph>
                          <button type="button" onClick={() => setFontSize([50])} className="cursor-pointer">
                            <Paragraph size="xs" color="primary">
                              Default
                            </Paragraph>
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-blue-primary">A</span>
                          <Slider value={fontSize} min={0} max={100} step={1} onValueChange={setFontSize} className="flex-1" />
                          <span className="text-base font-bold text-blue-primary">A</span>
                        </div>
                      </div>
                      <hr className="my-1 border-border" />
                      <div className="flex items-center justify-between py-1.5">
                        <Paragraph size="sm" color="dark">
                          Keyboard shortcuts
                        </Paragraph>
                        <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-500">
                          Shift + ?
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 rounded-full bg-neutral-100 p-1 text-sm">
                        <button
                          type="button"
                          onClick={() => setLanguage("en")}
                          className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
                            language === "en" ? "bg-blue-600 text-white" : "text-neutral-500"
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage("es")}
                          className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                            language === "es" ? "bg-blue-600 text-white" : "text-neutral-500"
                          }`}
                        >
                          Spanish
                        </button>
                        <span className="text-white/30">|</span>
                        <button
                          type="button"
                          onClick={() => setLanguage("ru")}
                          className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                            language === "ru" ? "bg-blue-600 text-white" : "text-neutral-500"
                          }`}
                        >
                          Russian
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <QuestionCard
              question={currentQuestion}
              selectedOptionId={selectedOptionId}
              checkResult={currentCheck}
              voiceOver={voiceOver}
              answerPopularity={answerPopularity}
              fontScale={questionFontScale}
              onSelectOption={selectOption}
            />
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>

          <div className="space-y-4">
            <div className=" rounded-2xl border border-border bg-white p-5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)]">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <Paragraph size="2xl" color="dark" className="font-semibold">
                    Your Progress
                  </Paragraph>
                  <Paragraph size="sm">{allowedToFail} allowed to pass</Paragraph>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRestartConfirm(true)}
                  className="border border-blue-300 hover:bg-blue-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden md:inline-block">Restart</span>
                </Button>
              </div>

              <div className="mb-4 mt-4 flex w-full flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                {(
                  [
                    { key: "all", label: "All", count: loadedQuestions.length },
                    { key: "correct", label: "Correct", count: correctCount },
                    { key: "incorrect", label: "Incorrect", count: incorrectCount },
                    { key: "flagged", label: "Flagged", count: flaggedCount },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setProgressFilter(tab.key)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 transition-colors ${
                      progressFilter === tab.key
                        ? "border-transparent bg-blue-1000 text-white"
                        : "border-border bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={progressFilter === tab.key ? "text-white/70" : "text-neutral-400"}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-8 gap-1.5">
                {loadedQuestions
                  .map((question, index) => ({ question, index }))
                  .filter(({ question }) => {
                    const check = checkedByQuestionId[question.id];
                    if (progressFilter === "correct") return check?.is_correct === true;
                    if (progressFilter === "incorrect") return check?.is_correct === false;
                    if (progressFilter === "flagged") return flaggedIds.has(question.id);
                    return true;
                  })
                  .map(({ question, index }) => {
                    const check = checkedByQuestionId[question.id];
                    const isCurrent = index === currentIndex;
                    const isLocked = index > furthestIndex;
                    const cellClass = isCurrent
                      ? "border-transparent bg-linear-to-r from-blue-500 to-blue-700 text-white"
                      : check?.is_correct === true
                        ? "border-green-200 bg-green-50 text-green-500"
                        : check?.is_correct === false
                          ? "border-red-200 bg-red-50 text-red-500"
                          : answers[question.id] !== undefined
                            ? "border-blue-200 bg-blue-50 text-blue-600"
                            : "border-border bg-background text-neutral-500";
                    return (
                      <button
                        key={question.id}
                        disabled={isLocked}
                        onClick={() => goToQuestion(index)}
                        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border text-sm font-semibold ${cellClass} ${
                          isLocked ? "cursor-not-allowed opacity-60" : ""
                        }`}
                      >
                        {flaggedIds.has(question.id) && (
                          <span className="absolute right-0 top-0 h-0 w-0 border-l-[10px] border-t-[10px] border-l-transparent border-t-amber-400" />
                        )}
                        {index + 1}
                      </button>
                    );
                  })}
              </div>
            </div>

            <HintPanel
              key={currentQuestion.id}
              quizId={quiz.id}
              questionId={currentQuestion.id}
              open={hintOpen}
              onToggle={() => setHintOpen((v) => !v)}
            />
          </div>
        </div>
        <div className="bg-white border-t border py-4 px-5 h-20 fixed w-full bottom-0 left-0">
          <div className="max-w-container mx-auto relative flex items-center justify-between gap-2">
            {streak >= 2 && <StreakBadge key={streak} streak={streak} />}
            <Button
              variant="ghost"
              className=" text-neutral-700 p-0!"
              size="sm"
              onClick={() => setShowReportDialog(true)}
            >
              <Flag className="w-5 stroke-neutral-500" />
              Flag for Mistake
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="md"
                disabled={currentIndex === 0}
                onClick={previousQuestion}
                className="border border-blue-300 hover:bg-blue-50"
              >
                <ArrowLeft /> Previous
              </Button>
              {currentIndex + 1 === loadedQuestions.length ? (
                <Button size="md" disabled={(isViewingFurthest && !isAnswered) || submitting} onClick={submitAttempt}>
                  {submitting ? "Grading…" : "See Results"}
                </Button>
              ) : (
                <Button size="md" disabled={isViewingFurthest && !isAnswered} onClick={nextQuestion}>
                  Next Question <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <RestartDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm} onConfirm={restart} />
      {currentQuestion && (
        <ReportMistakeDialog
          key={currentQuestion.id}
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          quizId={quiz.id}
          question={currentQuestion}
          onToast={(message, variant) => setToast({ message, variant })}
        />
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </>
  );
}
