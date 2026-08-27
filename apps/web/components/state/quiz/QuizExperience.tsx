"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Flag, Gem, LogOut, RotateCcw, Settings } from "lucide-react";
import type {
  AmbientTrack,
  ContentLanguage,
  PaginatedResponse,
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
import KeyboardShortcutsDialog from "@/components/state/quiz/KeyboardShortcutsDialog";
import RestartDialog from "@/components/state/quiz/RestartDialog";
import StreakBadge from "@/components/state/quiz/StreakBadge";
import ReportMistakeDialog from "@/components/state/quiz/ReportMistakeDialog";
import Toast, { type ToastVariant } from "@/components/state/quiz/Toast";
import QuizResults from "@/components/state/quiz/QuizResults";
import { api, ApiError } from "@/lib/api";
import { invalidatePhaseLadder } from "@/lib/phaseLadder";
import { invalidateResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useEntitlement } from "@/lib/auth-context";
import { translate, type QuizLanguage, type TFunction } from "@/lib/i18n/quiz";

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

// Learner-level preference (not per-quiz) — carries across every quiz they take.
function loadStoredLanguage(): QuizLanguage {
  try {
    const raw = localStorage.getItem("quiz-language");
    return raw === "es" || raw === "ru" ? raw : "en";
  } catch {
    return "en";
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
  initialView,
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
  /** "results" opens the player straight on the last attempt's results (from the detail page's
   *  "View results" button) rather than starting a fresh quiz. */
  initialView?: "results";
}) {
  // No QuizTaker mounted yet at this stage (loading/locked/empty), so read the stored preference
  // directly rather than via QuizTaker's own state, so these states respect it too.
  const t: TFunction = (key, vars) =>
    translate(loadStoredLanguage(), key, vars);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 relative">
        {quiz === undefined ? (
          <Paragraph className="py-20 text-center" color="muted">
            {t("loadingTest")}
          </Paragraph>
        ) : quiz === null ? (
          <div className="py-20 text-center space-y-4">
            <Paragraph color="muted">{loadError ?? t("testUnavailable")}</Paragraph>
            <Button href={notFoundHref}>{notFoundLabel}</Button>
          </div>
        ) : locked ? (
          <div className="py-20 text-center space-y-4">
            <Paragraph color="muted">
              {t("premiumQuizNotice")}
            </Paragraph>
            <Button href="/pricing">
              <Gem className="w-5" /> {t("upgradeToPremium")}
            </Button>
          </div>
        ) : !data?.questions || data.questions.length === 0 ? (
          <Paragraph className="py-20 text-center" color="muted">
            {t("testHasNoQuestions")}
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
            initialView={initialView}
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
  initialView,
}: {
  quiz: PublicQuiz;
  questions: PublicQuizQuestion[];
  title: string;
  exitHref: string;
  stateName: string;
  stateCode: string;
  onContinue: () => void | Promise<void>;
  initialView?: "results";
}) {
  const { isPremium } = useEntitlement();

  const [showResults, setShowResults] = useState(false);
  // When entered via "View results", we start on a loading screen while the last attempt is fetched
  // and its graded answers are rehydrated, then flip straight to the results view below.
  const [loadingResults, setLoadingResults] = useState(initialView === "results");
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
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [voiceOver, setVoiceOver] = useState(false);
  const [answerPopularity, setAnswerPopularity] = useState(false);
  const [ambientMusic, setAmbientMusic] = useState(false);
  const [ambientTrack, setAmbientTrack] = useState<number | null>(null);
  const [ambientTracks, setAmbientTracks] = useState<AmbientTrack[]>([]);
  const [fontSize, setFontSize] = useState([50]);

  const [language, setLanguageState] = useState<QuizLanguage>(loadStoredLanguage);
  const t: TFunction = (key, vars) =>
    translate(language, key, vars);
  // What was actually served for the current `language` — may be "en" even when `language` is
  // "es"/"ru" if translation isn't available (unconfigured, or failed) for this quiz right now.
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>("en");
  const [translating, setTranslating] = useState(false);
  // Per-language translated question sets already fetched this attempt, so switching back and
  // forth (or restarting) never re-hits the API for a language already seen once.
  const translatedCacheRef = useRef<Partial<Record<"es" | "ru", PublicQuizQuestion[]>>>({});

  // Re-maps `order` (an existing loadedQuestions array, whatever its current shuffle/progress
  // position) onto the requested language's text, by question id — never changes array order.
  function applyLanguageToOrder(order: PublicQuizQuestion[], lang: QuizLanguage): PublicQuizQuestion[] {
    const source = lang === "en" ? questions : translatedCacheRef.current[lang];
    if (!source) return order;
    const byId = new Map(source.map((q) => [q.id, q]));
    return order.map((q) => byId.get(q.id) ?? q);
  }

  // Fetches (if not already cached) and applies a language, updating loadedQuestions in place —
  // shared by both the user-driven language switch and restoring a stored preference on mount.
  async function applyLanguage(next: QuizLanguage) {
    if (next === "en" || translatedCacheRef.current[next]) {
      setLoadedQuestions((prev) => applyLanguageToOrder(prev, next));
      setContentLanguage(next);
      setLanguageState(next);
      return;
    }

    setTranslating(true);
    try {
      const res = await api.get<QuizShowResponse>(`/quizzes/${quiz.id}?language=${next}`);
      if (res.questions) translatedCacheRef.current[next] = res.questions;
      setLoadedQuestions((prev) => applyLanguageToOrder(prev, next));
      setContentLanguage(res.content_language);
      if (res.content_language === "en") {
        setToast({ message: t("translationNotReadyToast"), variant: "error" });
      }
    } catch {
      setContentLanguage("en");
      setToast({ message: t("translationFailedToast"), variant: "error" });
    } finally {
      setTranslating(false);
    }
    setLanguageState(next);
  }

  function changeLanguage(next: QuizLanguage) {
    if (next === language || translating) return;
    try {
      localStorage.setItem("quiz-language", next);
    } catch {
      // ignore quota / private-mode errors
    }
    applyLanguage(next);
  }

  // Restore a stored non-English preference once on mount (the initial loadedQuestions/questions
  // props are always English, since `show` without `?language=` always serves English).
  useEffect(() => {
    // applyLanguage only sets state synchronously in this effect's own tick when the cache
    // already has the language (never true on mount); otherwise every setState happens after the
    // `await` below, i.e. asynchronously — a false positive for this rule, same as the ambient
    // track fetch above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (language !== "en") applyLanguage(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ----- Voice-over (Web Speech API) -----
  // Owned by the parent (not QuestionCard) so the `v` / `e` / `tv` keyboard shortcuts and the
  // in-card speaker button all drive the same speech state. No TTS library is installed and the
  // API never returns pre-recorded audio assets, so SpeechSynthesis is the only option here.
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("en"));
      if (voice) utterance.voice = voice;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      // Some engines throw on malformed voices or mid-navigation speak() calls — voice-over is a
      // nice-to-have, so fail silently rather than taking the screen down with it.
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speakQuestion = useCallback(() => {
    if (!currentQuestion) return;
    const optionsText = currentQuestion.answers
      .map((option, index) => `Option ${String.fromCharCode(65 + index)}: ${option.answer_text}`)
      .join(". ");
    speak(`${currentQuestion.question_text}. ${optionsText}`);
  }, [currentQuestion, speak]);

  const speakExplanation = useCallback(() => {
    if (!currentQuestion || !currentCheck) return;
    const correctAnswer = currentQuestion.answers.find((a) => a.id === currentCheck.correct_answer_id);
    const resultText = currentCheck.is_correct
      ? "Correct!"
      : `Incorrect. The correct answer is ${correctAnswer?.answer_text ?? ""}.`;
    speak(currentCheck.explanation ? `${resultText} ${currentCheck.explanation}` : resultText);
  }, [currentQuestion, currentCheck, speak]);

  const toggleSpeakQuestion = useCallback(
    () => (isSpeaking ? stopSpeaking() : speakQuestion()),
    [isSpeaking, stopSpeaking, speakQuestion],
  );

  // Auto-read the question whenever voice-over is on and the question changes; stop on toggle-off
  // or when navigating away.
  useEffect(() => {
    if (!voiceOver) return;
    // speak() only flips isSpeaking asynchronously inside the utterance callbacks, never
    // synchronously here — a false positive for this rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    speakQuestion();
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [voiceOver, speakQuestion]);

  // Once the current answer is graded, read the result + explanation aloud too.
  useEffect(() => {
    if (!voiceOver || !currentCheck) return;
    // Same false positive as above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    speakExplanation();
  }, [voiceOver, currentCheck, speakExplanation]);

  async function selectOption(optionId: number) {
    if (!currentQuestion) return;
    // Once a question is graded it's locked — the reveal is final.
    if (checkedByQuestionId[currentQuestion.id]) return;
    const questionId = currentQuestion.id;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    try {
      const languageQuery = language !== "en" ? `?language=${language}` : "";
      const res = await api.post<QuizAnswerCheckResponse>(
        `/quizzes/${quiz.id}/questions/${questionId}/check${languageQuery}`,
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

  // ----- Keyboard shortcuts (reference sheet: KeyboardShortcutsDialog) -----
  // "t" arms a two-key chord (ta / tf / tv); the timer disarms it if no second key follows in time.
  const chordArmedRef = useRef(false);
  const chordTimerRef = useRef<number | null>(null);

  // Cycle the question font size small → default → large → small (mirrors the settings slider).
  function cycleFontSize() {
    setFontSize(([v]) => [v <= 0 ? 50 : v < 100 ? 100 : 0]);
  }

  // Enter/confirm: submit on the last question, otherwise advance — gated by the same conditions
  // that enable the bottom-bar Next / See-results buttons.
  function advance() {
    const isLast = currentIndex + 1 === loadedQuestions.length;
    if (isLast) {
      if (!((isViewingFurthest && !isAnswered) || submitting)) submitAttempt();
    } else if (!(isViewingFurthest && !isAnswered)) {
      nextQuestion();
    }
  }

  function handleShortcutKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // A blocking dialog owns the keyboard while it's open.
    if (showReportDialog || showRestartConfirm) return;

    // "?" (Shift + /) toggles the reference sheet from anywhere.
    if (e.key === "?") {
      e.preventDefault();
      setShowShortcuts((v) => !v);
      return;
    }
    // While the sheet is open, let the dialog own the keyboard (Esc / the close button dismiss it).
    if (showShortcuts) return;
    // Shortcuts only apply while actively taking the quiz, not on the loading/results screens.
    if (showResults || loadingResults) return;

    const key = e.key.toLowerCase();

    // Second key of a "t…" chord.
    if (chordArmedRef.current) {
      chordArmedRef.current = false;
      if (chordTimerRef.current) window.clearTimeout(chordTimerRef.current);
      if (key === "a") {
        e.preventDefault();
        setAnswerPopularity((v) => !v);
        return;
      }
      if (key === "f") {
        e.preventDefault();
        cycleFontSize();
        return;
      }
      if (key === "v") {
        e.preventDefault();
        setVoiceOver((v) => !v);
        return;
      }
      // Any other key after "t" falls through and is handled on its own below.
    }

    // Arm the chord prefix.
    if (key === "t") {
      chordArmedRef.current = true;
      if (chordTimerRef.current) window.clearTimeout(chordTimerRef.current);
      chordTimerRef.current = window.setTimeout(() => {
        chordArmedRef.current = false;
      }, 1200);
      return;
    }

    // 1–4 select the answer at that position (1 → A) while the question is still open.
    if (key >= "1" && key <= "4") {
      const idx = Number(key) - 1;
      if (currentQuestion && !checkedByQuestionId[currentQuestion.id] && idx < currentQuestion.answers.length) {
        e.preventDefault();
        selectOption(currentQuestion.answers[idx].id);
      }
      return;
    }

    switch (key) {
      case "enter":
        e.preventDefault();
        advance();
        break;
      case "n":
      case "arrowright":
        e.preventDefault();
        nextQuestion();
        break;
      case "p":
      case "arrowleft":
        e.preventDefault();
        previousQuestion();
        break;
      case "c":
        e.preventDefault();
        goToQuestion(furthestIndex);
        break;
      case "v":
        e.preventDefault();
        toggleSpeakQuestion();
        break;
      case "e":
        e.preventDefault();
        if (isSpeaking) stopSpeaking();
        else speakExplanation();
        break;
    }
  }

  // Bind the listener once, but always call the freshest handler so it reads current state
  // (question, indexes, toggles) without re-subscribing on every keystroke.
  const shortcutHandlerRef = useRef(handleShortcutKey);
  useEffect(() => {
    shortcutHandlerRef.current = handleShortcutKey;
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => shortcutHandlerRef.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  function restart() {
    setAnswers({});
    setCurrentIndex(0);
    setFurthestIndex(0);
    setShowResults(false);
    setAttempt(null);
    setCheckedByQuestionId({});
    streakRef.current = 0;
    setStreak(0);
    // Re-shuffle questions for the new attempt, keeping whatever language is currently active.
    setLoadedQuestions(applyLanguageToOrder(shuffleQuiz(questions), language));
  }

  // "View results" entry: fetch this quiz's latest attempt and rehydrate its graded answers so the
  // results screen (and per-question review) renders exactly as it did right after finishing —
  // gradedByQuestionId/questionStatuses derive from `attempt`, the rest from checkedByQuestionId.
  // No attempt found (or the fetch fails) → fall through to a normal fresh quiz.
  useEffect(() => {
    if (initialView !== "results") return;
    let cancelled = false;

    api
      .get<PaginatedResponse<QuizAttempt>>(`/attempts?quiz=${quiz.id}&per_page=1`)
      .then((res) => {
        if (cancelled) return;
        const past = res.data[0];
        if (!past) {
          setLoadingResults(false);
          return;
        }

        const checked: Record<number, QuizAnswerCheckResponse> = {};
        const restoredAnswers: Record<number, number> = {};
        for (const a of past.answers ?? []) {
          checked[a.question_id] = {
            question_id: a.question_id,
            selected_answer_id: a.selected_answer_id,
            correct_answer_id: a.correct_answer_id,
            is_correct: a.is_correct,
            explanation: a.explanation,
            answer_popularity: null,
          };
          if (a.selected_answer_id != null) restoredAnswers[a.question_id] = a.selected_answer_id;
        }

        setCheckedByQuestionId(checked);
        setAnswers(restoredAnswers);
        setAttempt(past);
        setShowResults(true);
        setLoadingResults(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingResults(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // This quiz is now completed — drop the cached ladder AND the resolved-quiz cache so both the
      // ladder (newly unlocked step, pass/fail badge) and the detail page ("Restart" / "View
      // results" buttons) rebuild with fresh completion state when the learner heads back.
      invalidatePhaseLadder();
      invalidateResolvedQuiz();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t("submitFailedError"));
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


  if (loadingResults) {
    return (
      <Paragraph className="py-20 text-center" color="muted">
        {t("loadingTest")}
      </Paragraph>
    );
  }

  if (showResults) {
    return (
      <QuizResults
        results={questionStatuses.map((s) => s === "correct")}
        quizId={quiz.id}
        wrongQuestionIds={loadedQuestions
          .filter((_, i) => questionStatuses[i] === "incorrect")
          .map((q) => q.id)}
        passingThreshold={quiz.passing_score_percent ?? 80}
        showUpsell={!isPremium}
        stateName={stateName}
        stateCode={stateCode}
        onRetry={restart}
        onContinue={onContinue}
        onSelectQuestion={viewQuestion}
        t={t}
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
            {t("exit")}
          </Button>
          <div className="flex shrink-0 items-center justify-center gap-4">
            <Paragraph
              size="sm"
              color="primary"
              className="hidden md:block rounded-full border border-blue-300 bg-blue-50 px-3 py-0.5 font-semibold"
            >
              ✦ {t("practiceBadge")}
            </Paragraph>
            <Paragraph size="sm" color="dark" className=" font-semibold">
              {title}
            </Paragraph>
          </div>
          <Button href="/pricing" size="sm" variant="gold">
            <Gem className="w-5" /> {t("upgrade")}
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
                          {t("voiceOver")}
                        </Paragraph>
                        <Switch checked={voiceOver} onCheckedChange={setVoiceOver} />
                      </div>
                      <hr className="my-1 border-border" />
                      <div className="flex items-center justify-between py-1.5">
                        <Paragraph size="sm" color="dark">
                          {t("answerPopularity")}
                        </Paragraph>
                        <Switch checked={answerPopularity} onCheckedChange={setAnswerPopularity} />
                      </div>
                      <hr className="my-1 border-border" />
                      <div className="flex items-center justify-between py-1.5">
                        <Paragraph size="sm" color="dark">
                          {t("ambientMusic")}
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
                            {t("fontSize")}
                          </Paragraph>
                          <button type="button" onClick={() => setFontSize([50])} className="cursor-pointer">
                            <Paragraph size="xs" color="primary">
                              {t("default")}
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
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          setShowShortcuts(true);
                        }}
                        className="flex w-full cursor-pointer items-center justify-between rounded-md py-1.5 transition-colors hover:bg-neutral-50"
                      >
                        <Paragraph size="sm" color="dark">
                          {t("keyboardShortcuts")}
                        </Paragraph>
                        <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-500">
                          Shift + ?
                        </span>
                      </button>
                      <div className="flex items-center justify-center gap-1 rounded-full bg-neutral-100 p-1 text-sm">
                        <button
                          type="button"
                          disabled={translating}
                          onClick={() => changeLanguage("en")}
                          className={`rounded-full px-4 py-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            language === "en" ? "bg-blue-600 text-white" : "text-neutral-500"
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          disabled={translating}
                          onClick={() => changeLanguage("es")}
                          className={`rounded-full px-3 py-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            language === "es" ? "bg-blue-600 text-white" : "text-neutral-500"
                          }`}
                        >
                          Spanish
                        </button>
                        <span className="text-white/30">|</span>
                        <button
                          type="button"
                          disabled={translating}
                          onClick={() => changeLanguage("ru")}
                          className={`rounded-full px-3 py-1.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            language === "ru" ? "bg-blue-600 text-white" : "text-neutral-500"
                          }`}
                        >
                          Russian
                        </button>
                      </div>
                      {translating && (
                        <Paragraph size="xs" color="muted" className="pt-2 text-center">
                          {t("translatingQuiz")}
                        </Paragraph>
                      )}
                      {contentLanguage !== "en" && !translating && (
                        <Paragraph size="xs" color="muted" className="pt-2 text-center">
                          {t("machineTranslatedNotice")}
                        </Paragraph>
                      )}
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
              isSpeaking={isSpeaking}
              onToggleSpeak={toggleSpeakQuestion}
              answerPopularity={answerPopularity}
              fontScale={questionFontScale}
              onSelectOption={selectOption}
              t={t}
            />
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>

          <div className="space-y-4">
            <div className=" rounded-2xl border border-border bg-white p-5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)]">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <Paragraph size="2xl" color="dark" className="font-semibold">
                    {t("yourProgress")}
                  </Paragraph>
                  <Paragraph size="sm">{t("allowedToFail", { count: allowedToFail })}</Paragraph>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRestartConfirm(true)}
                  className="border border-blue-300 hover:bg-blue-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden md:inline-block">{t("restart")}</span>
                </Button>
              </div>

              <div className="mb-4 mt-4 flex w-full flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                {(
                  [
                    { key: "all", label: t("all"), count: loadedQuestions.length },
                    { key: "correct", label: t("correct"), count: correctCount },
                    { key: "incorrect", label: t("incorrect"), count: incorrectCount },
                    { key: "flagged", label: t("flagged"), count: flaggedCount },
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
              t={t}
            />
          </div>
        </div>
        <div className="bg-white border-t border py-4 px-5 h-20 fixed w-full bottom-0 left-0">
          <div className="max-w-container mx-auto relative flex items-center justify-between gap-2">
            {streak >= 2 && <StreakBadge key={streak} streak={streak} language={language} />}
            <Button
              variant="ghost"
              className=" text-neutral-700 p-0!"
              size="sm"
              onClick={() => setShowReportDialog(true)}
            >
              <Flag className="w-5 stroke-neutral-500" />
              {t("flagForMistake")}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="md"
                disabled={currentIndex === 0}
                onClick={previousQuestion}
                className="border border-blue-300 hover:bg-blue-50"
              >
                <ArrowLeft /> {t("previous")}
              </Button>
              {currentIndex + 1 === loadedQuestions.length ? (
                <Button size="md" disabled={(isViewingFurthest && !isAnswered) || submitting} onClick={submitAttempt}>
                  {submitting ? t("grading") : t("seeResults")}
                </Button>
              ) : (
                <Button size="md" disabled={isViewingFurthest && !isAnswered} onClick={nextQuestion}>
                  {t("nextQuestion")} <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <RestartDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm} onConfirm={restart} t={t} />
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} t={t} />
      {currentQuestion && (
        <ReportMistakeDialog
          key={currentQuestion.id}
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          quizId={quiz.id}
          question={currentQuestion}
          onToast={(message, variant) => setToast({ message, variant })}
          t={t}
        />
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </>
  );
}
