"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  Flag,
  Gem,
  LogOut,
  RotateCcw,
  SendHorizontal,
  Settings,
} from "lucide-react";
import type { PaginatedResponse, PublicQuiz, QuizAttempt, QuizShowResponse } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import Slider from "@/components/ui/Slider";
import Switch from "@/components/ui/Switch";
import PremiumDialog from "@/components/billing/PremiumDialog";
import QuestionCard from "@/components/state/quiz/QuestionCard";
import QuizResults from "@/components/state/quiz/QuizResults";
import { api, ApiError } from "@/lib/api";
import { isValidState, slugToStateName, stateAbbreviations } from "@/lib/usStates";
import { useWebLayout, WebLayoutProvider } from "@/lib/web-layout-context";

const allowedToFail = 4;

const vehicleSlugs: Record<string, string> = {
  Car: "car",
  Motorcycle: "motorcycle",
  CDL: "cdl",
};

const ambientTracks = [
  { value: "chasing-horizons", label: "Chasing Horizons" },
  { value: "quiet-streets", label: "Driving Through Quiet Streets" },
  { value: "smooth-lane-changes", label: "Smooth Lane Changes" },
  { value: "stay-in-your-lane", label: "Stay in Your Lane" },
  { value: "ready-to-ride", label: "Ready to Ride" },
  { value: "go-the-distance", label: "Go the Distance" },
  { value: "go-the-distance-2", label: "Go the Distance 2" },
  { value: "in-the-drivers-seat", label: "In the Driver's Seat" },
];

function QuizPageInner({ state, testSlug }: { state: string; testSlug: string }) {
  const router = useRouter();
  const { selectedVehicle } = useWebLayout();
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";

  const stateNameCandidate = slugToStateName(state);
  const stateName = isValidState(stateNameCandidate) ? stateNameCandidate : "Alaska";
  const stateCode = stateAbbreviations[stateName];

  const [showResults, setShowResults] = useState(false);
  const [quiz, setQuiz] = useState<PublicQuiz | null | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  const [data, setData] = useState<QuizShowResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());

  // Resolve the real quiz id from the state+vehicle+slug in the URL, then fetch it.
  useEffect(() => {
    let cancelled = false;

    api
      .get<PaginatedResponse<PublicQuiz>>(`/quizzes?state=${stateCode}&vehicle_type=${vehicleType}&slug=${testSlug}`)
      .then((res) => {
        if (cancelled) return;
        const found = res.data[0];
        setQuiz(found ?? null);
        if (!found) return;

        return api.get<QuizShowResponse>(`/quizzes/${found.id}`).then((showRes) => {
          if (cancelled) return;
          setData(showRes);
          setLocked(showRes.locked);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "This test isn't available right now.");
        setQuiz(null);
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, testSlug]);

  const [hintOpen, setHintOpen] = useState(true);
  const [isPremiumUser] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const [voiceOver, setVoiceOver] = useState(false);
  const [answerPopularity, setAnswerPopularity] = useState(false);
  const [ambientMusic, setAmbientMusic] = useState(false);
  const [ambientTrack, setAmbientTrack] = useState("chasing-horizons");
  const [fontSize, setFontSize] = useState([50]);
  const [language, setLanguage] = useState<"en" | "es" | "ru">("en");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadedQuestions = useMemo(() => data?.questions ?? [], [data]);

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
  const correctCount = questionStatuses.filter((s) => s === "correct").length;
  const incorrectCount = questionStatuses.filter((s) => s === "incorrect").length;

  function selectOption(optionId: number) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
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

  function restart() {
    setAnswers({});
    setCurrentIndex(0);
    setFurthestIndex(0);
    setShowResults(false);
    setAttempt(null);
  }

  async function submitAttempt() {
    if (!quiz) return;
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

  function goToTestPage() {
    router.push(`/${state}/${testSlug}`);
  }
  function viewQuestion(index: number) {
    setShowResults(false);
    setCurrentIndex(index);
  }
  function handleBookmarkClick() {
    if (!isPremiumUser) {
      setShowPremiumDialog(true);
    }
  }

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
            <Button href={`/${state}`}>Back to {stateName}</Button>
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
        ) : showResults ? (
          <QuizResults
            quizName={`${stateName} ${quiz.title}`}
            results={questionStatuses.map((s) => s === "correct")}
            onRetry={restart}
            onContinue={goToTestPage}
            onSelectQuestion={viewQuestion}
          />
        ) : (
          <>
            <div className="bg-white sticky top-0 z-90">
              <div className="max-w-container lg:mx-auto mx-5  flex items-center justify-between gap-3 py-3.5">
                <Button href={`/${state}/${testSlug}`} variant="ghost" className=" text-neutral-700 p-0!" size="sm">
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
                    {stateName} {quiz.title}
                  </Paragraph>
                </div>
                <Button href="/pricing" size="sm">
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
                      <Bookmark onClick={handleBookmarkClick} className="h-6 w-6 cursor-pointer text-neutral-500" />
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
                            {ambientMusic && (
                              <div className="pb-1.5">
                                <select
                                  value={ambientTrack}
                                  onChange={(e) => setAmbientTrack(e.target.value)}
                                  className="w-full rounded-full bg-neutral-100 px-3 py-2 text-sm"
                                >
                                  {ambientTracks.map((track) => (
                                    <option key={track.value} value={track.value}>
                                      {track.label}
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
                    isAnswered={isAnswered}
                    isLastQuestion={currentIndex === loadedQuestions.length - 1}
                    isViewingFurthest={isViewingFurthest}
                    voiceOver={voiceOver}
                    fontScale={questionFontScale}
                    onSelectOption={selectOption}
                    onNextQuestion={nextQuestion}
                    onSeeResults={submitAttempt}
                  />
                  {submitError && <p className="text-sm text-destructive">{submitError}</p>}
                </div>

                <div className="space-y-4">
                  <div className=" rounded-2xl border border-border bg-white p-5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <Paragraph size="2xl" color="dark" className="font-semibold">
                          Your Progress
                        </Paragraph>
                        <Paragraph size="sm">{allowedToFail} allowed to pass</Paragraph>
                      </div>

                      <Button variant="outline" size="sm" onClick={restart}>
                        <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden md:inline-block">Restart</span>
                      </Button>
                    </div>

                    <Paragraph className="mb-4 flex items-center gap-4" size="xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <strong>{incorrectCount} </strong>
                        Incorrect
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <strong>{correctCount} </strong>
                        Correct
                      </span>
                    </Paragraph>

                    <div className="flex justify-start flex-wrap gap-1.5">
                      {loadedQuestions.map((question, index) => (
                        <button
                          key={question.id}
                          disabled={index > furthestIndex}
                          onClick={() => goToQuestion(index)}
                          className={`w-10.5 flex aspect-square border items-center justify-center rounded-md text-sm font-semibold ${
                            questionStatuses[index] === "correct" ? "bg-green-50 text-green-500 border-green-200" : ""
                          } ${questionStatuses[index] === "incorrect" ? "bg-red-50 border-red-200 text-red-500" : ""} ${
                            questionStatuses[index] === "unanswered" && answers[question.id] !== undefined
                              ? "bg-blue-50 border-blue-200 text-blue-600"
                              : questionStatuses[index] === "unanswered"
                                ? "bg-background text-neutral-500"
                                : ""
                          } ${index === furthestIndex ? "bg-linear-to-r from-blue-500 to-blue-700 text-white" : ""} ${index === currentIndex && index !== furthestIndex ? "ring-2 ring-blue-500" : ""} ${
                            index > furthestIndex ? "cursor-not-allowed!" : ""
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)]">
                    <button
                      onClick={() => setHintOpen((v) => !v)}
                      className="flex w-full items-start justify-between gap-2 text-left text-sm text-neutral-600"
                    >
                      Need a hint or a quick explanation? Tap the button or type a question for instant help.
                      <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform ${hintOpen ? "rotate-180" : ""}`} />
                    </button>

                    {hintOpen && (
                      <div className="mt-3 space-y-3 space-x-2">
                        <Button variant="secondary" size="sm" disabled>
                          Give me a hint (coming soon)
                        </Button>
                        <Button variant="secondary" size="sm" disabled>
                          Explain further (coming soon)
                        </Button>

                        <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 opacity-60">
                          <input
                            type="text"
                            disabled
                            placeholder="AI tutor coming soon…"
                            className="w-full text-sm outline-none placeholder:text-neutral-400"
                          />
                          <Button disabled className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-primary p-0! text-white">
                            <SendHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white border-t border py-4 px-5 h-20 fixed w-full bottom-0 left-0">
                <div className="max-w-container mx-auto flex items-center justify-between gap-2">
                  <Button variant="ghost" className=" text-neutral-700 p-0!" size="sm">
                    <Flag className="w-5 stroke-neutral-500" />
                    Report a mistake
                  </Button>
                  {currentIndex + 1 === loadedQuestions.length ? (
                    <Button size="md" disabled={!isAnswered || !isViewingFurthest || submitting} onClick={submitAttempt}>
                      {submitting ? "Grading…" : "See Results"}
                    </Button>
                  ) : (
                    <Button size="md" disabled={!isAnswered || !isViewingFurthest} onClick={nextQuestion}>
                      Next Question <ArrowRight />
                    </Button>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <PremiumDialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog} />
    </div>
  );
}

export default function TestQuizPage({
  params,
}: {
  params: Promise<{ state: string; "test-slug": string }>;
}) {
  const { state, "test-slug": testSlug } = use(params);

  return (
    <WebLayoutProvider stateSlug={state}>
      <QuizPageInner state={state} testSlug={testSlug} />
    </WebLayoutProvider>
  );
}
