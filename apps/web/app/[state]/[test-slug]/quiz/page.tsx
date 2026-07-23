"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  EllipsisVertical,
  Flag,
  Gem,
  LogOut,
  RotateCcw,
  SendHorizontal,
  Settings,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import Slider from "@/components/ui/Slider";
import Switch from "@/components/ui/Switch";
import PremiumDialog from "@/components/billing/PremiumDialog";
import QuestionCard from "@/components/state/quiz/QuestionCard";
import QuizResults from "@/components/state/quiz/QuizResults";
import type { QuizQuestionStatic } from "@/components/state/quiz/types";
import { fetchQuizQuestions } from "@/lib/mockQuizQuestions";
import { isValidState, slugToStateName } from "@/lib/usStates";
import { WebLayoutProvider } from "@/lib/web-layout-context";

const allowedToFail = 4;
const totalQuestionPool = 500;

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

export default function TestQuizPage({
  params,
}: {
  params: Promise<{ state: string; "test-slug": string }>;
}) {
  const { state, "test-slug": testSlug } = use(params);
  const router = useRouter();

  const stateNameCandidate = slugToStateName(state);
  const stateName = isValidState(stateNameCandidate)
    ? stateNameCandidate
    : "Alaska";

  const [showResults, setShowResults] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestionStatic[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    let cancelled = false;
    setQuestions(null);
    fetchQuizQuestions(state, testSlug).then((data) => {
      if (!cancelled) setQuestions(data);
    });
    return () => {
      cancelled = true;
    };
  }, [state, testSlug]);

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
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      )
        setSettingsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadedQuestions = useMemo(() => questions ?? [], [questions]);

  const isViewingFurthest = currentIndex === furthestIndex;
  const currentQuestion = loadedQuestions[currentIndex];
  const selectedOptionId = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const isAnswered = selectedOptionId !== undefined;

  const questionFontScale = useMemo(
    () => 0.85 + (fontSize[0] / 100) * 0.45,
    [fontSize],
  );

  const correctCount = useMemo(
    () =>
      loadedQuestions.filter((q) => {
        const pick = answers[q.id];
        return (
          pick !== undefined && q.options.find((o) => o.id === pick)?.isCorrect
        );
      }).length,
    [loadedQuestions, answers],
  );

  const incorrectCount = useMemo(
    () =>
      loadedQuestions.filter((q) => {
        const pick = answers[q.id];
        return (
          pick !== undefined && !q.options.find((o) => o.id === pick)?.isCorrect
        );
      }).length,
    [loadedQuestions, answers],
  );

  const missedCategories = useMemo(
    () =>
      loadedQuestions
        .filter((q) => {
          const pick = answers[q.id];
          return (
            pick !== undefined &&
            !q.options.find((o) => o.id === pick)?.isCorrect
          );
        })
        .map((q) => q.category)
        .filter((category, index, all) => all.indexOf(category) === index),
    [loadedQuestions, answers],
  );

  const visibleRiskAreas = missedCategories.slice(0, 3);
  const extraRiskAreaCount = Math.max(
    0,
    missedCategories.length - visibleRiskAreas.length,
  );

  function questionStatus(
    question: QuizQuestionStatic,
  ): "correct" | "incorrect" | "unanswered" {
    const pick = answers[question.id];
    if (pick === undefined) return "unanswered";
    return question.options.find((o) => o.id === pick)?.isCorrect
      ? "correct"
      : "incorrect";
  }

  const questionStatuses = loadedQuestions.map((q) => questionStatus(q));

  function selectOption(optionId: number) {
    if (isAnswered || !currentQuestion) return;
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
  }

  function goToTestPage() {
    router.push(`/${state}/${testSlug}`);
  }
  function handleBookmarkClick() {
    if (!isPremiumUser) {
      setShowPremiumDialog(true);
    }
  }

  return (
    <WebLayoutProvider stateSlug={state}>
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex-1 relative">
          <div className="bg-white sticky top-0 z-90">
            <div className="max-w-container mx-auto flex items-center justify-between gap-3 py-3.5">
              <Button
                href={`/${state}/${testSlug}`}
                variant="ghost"
                className=" text-neutral-700"
                size="sm"
              >
                <LogOut className="w-5 h-5 text-neutral-500" />
                Exit
              </Button>
              <div className="flex shrink-0 items-center justify-center gap-4">
                <Paragraph
                  size="sm"
                  color="primary"
                  className=" rounded-full border border-blue-300 bg-blue-50 px-3 py-0.5 font-semibold"
                >
                  ✦ Practice
                </Paragraph>
                <Paragraph size="sm" color="dark" className=" font-semibold">
                  {stateName} Permit
                </Paragraph>
              </div>
              <Button href={`/${state}/${testSlug}`} size="sm">
                <Gem className="w-5" /> Upgrade
              </Button>
            </div>
            <div className="h-2.5 flex-1 overflow-hidden bg-[#F2F1EC]">
              <div
                className="h-2.5 bg-linear-to-r rounded-tr-2xl rounded-br-2xl from-blue-500 to-blue-700 transition-all"
                style={{
                  width: loadedQuestions.length
                    ? `${((currentIndex + 1) / loadedQuestions.length) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>

          <div className="">
            {!questions ? (
              <Paragraph className="py-20 text-center" color="muted">
                Loading test…
              </Paragraph>
            ) : showResults ? (
              <QuizResults
                stateName={stateName}
                incorrectCount={incorrectCount}
                questionsLength={loadedQuestions.length}
                totalQuestionPool={totalQuestionPool}
                riskAreas={visibleRiskAreas}
                extraRiskAreaCount={extraRiskAreaCount}
                onExit={goToTestPage}
              />
            ) : (
              <section className="pt-6 lg:pt-15 pb-35">
                <div className="max-w-container mx-auto grid grid-cols-1 gap-4 lg:grid-cols-[1fr_440px]">
                  <div className="p-5 lg:p-8 rounded-3xl border border-border bg-white shadow-[0_20px_50px_-26px_rgba(23,37,84,0.25)] space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex shrink-0 items-center justify-center gap-4">
                        <Paragraph
                          size="sm"
                          color="primary"
                          className=" rounded-full  bg-blue-50 px-3 py-1 font-semibold"
                        >
                          {currentQuestion.category}
                        </Paragraph>
                        <Paragraph size="sm">
                          <strong>Questions</strong> {currentIndex + 1}/
                          {loadedQuestions.length}
                        </Paragraph>
                      </div>
                      <div className="flex gap-3 items-center justify-center">
                        <Bookmark
                          onClick={handleBookmarkClick}
                          className="h-6 w-6 cursor-pointer text-neutral-500"
                        />
                        <div className="relative" ref={settingsRef}>
                          <Settings
                            onClick={() => setSettingsOpen((v) => !v)}
                            className="h-6 w-6 cursor-pointer text-neutral-500"
                          />

                          {settingsOpen && (
                            <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-lg border bg-white p-3 shadow-lg">
                              <div className="flex items-center justify-between py-1.5">
                                <Paragraph size="sm" color="dark">
                                  Voice over
                                </Paragraph>
                                <Switch
                                  checked={voiceOver}
                                  onCheckedChange={setVoiceOver}
                                />
                              </div>
                              <hr className="my-1 border-border" />
                              <div className="flex items-center justify-between py-1.5">
                                <Paragraph size="sm" color="dark">
                                  Answer popularity
                                </Paragraph>
                                <Switch
                                  checked={answerPopularity}
                                  onCheckedChange={setAnswerPopularity}
                                />
                              </div>
                              <hr className="my-1 border-border" />
                              <div className="flex items-center justify-between py-1.5">
                                <Paragraph size="sm" color="dark">
                                  Ambient music
                                </Paragraph>
                                <Switch
                                  checked={ambientMusic}
                                  onCheckedChange={setAmbientMusic}
                                />
                              </div>
                              {ambientMusic && (
                                <div className="pb-1.5">
                                  <select
                                    value={ambientTrack}
                                    onChange={(e) =>
                                      setAmbientTrack(e.target.value)
                                    }
                                    className="w-full rounded-full bg-neutral-100 px-3 py-2 text-sm"
                                  >
                                    {ambientTracks.map((track) => (
                                      <option
                                        key={track.value}
                                        value={track.value}
                                      >
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
                                  <button
                                    type="button"
                                    onClick={() => setFontSize([50])}
                                    className="cursor-pointer"
                                  >
                                    <Paragraph size="xs" color="primary">
                                      Default
                                    </Paragraph>
                                  </button>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-blue-primary">
                                    A
                                  </span>
                                  <Slider
                                    value={fontSize}
                                    min={0}
                                    max={100}
                                    step={1}
                                    onValueChange={setFontSize}
                                    className="flex-1"
                                  />
                                  <span className="text-base font-bold text-blue-primary">
                                    A
                                  </span>
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
                                    language === "en"
                                      ? "bg-blue-600 text-white"
                                      : "text-neutral-500"
                                  }`}
                                >
                                  English
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLanguage("es")}
                                  className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                                    language === "es"
                                      ? "bg-blue-600 text-white"
                                      : "text-neutral-500"
                                  }`}
                                >
                                  Spanish
                                </button>
                                <span className="text-white/30">|</span>
                                <button
                                  type="button"
                                  onClick={() => setLanguage("ru")}
                                  className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${
                                    language === "ru"
                                      ? "bg-blue-600 text-white"
                                      : "text-neutral-500"
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
                      isLastQuestion={
                        currentIndex === loadedQuestions.length - 1
                      }
                      isViewingFurthest={isViewingFurthest}
                      voiceOver={voiceOver}
                      fontScale={questionFontScale}
                      onSelectOption={selectOption}
                      onNextQuestion={nextQuestion}
                      onSeeResults={() => setShowResults(true)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_16px_50px_-26px_rgba(23,37,84,0.20)]">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <Paragraph
                            size="2xl"
                            color="dark"
                            className="font-semibold"
                          >
                            Your Progress
                          </Paragraph>
                          <Paragraph size="sm">
                            {allowedToFail} allowed to pass
                          </Paragraph>
                        </div>

                        <Button variant="outline" size="sm" onClick={restart}>
                          <RotateCcw className="h-3.5 w-3.5" /> Restart
                        </Button>
                      </div>

                      <Paragraph
                        className="mb-4 flex items-center gap-4"
                        size="xs"
                      >
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

                      <div className="grid grid-cols-8 gap-1.5">
                        {loadedQuestions.map((question, index) => (
                          <button
                            key={question.id}
                            disabled={index > furthestIndex}
                            onClick={() => goToQuestion(index)}
                            className={`flex aspect-square border items-center justify-center rounded-md text-sm font-semibold ${
                              questionStatuses[index] === "correct"
                                ? "bg-green-50 text-green-500 border-green-200"
                                : ""
                            } ${questionStatuses[index] === "incorrect" ? "bg-red-50 border-red-200 text-red-500" : ""} ${
                              questionStatuses[index] === "unanswered"
                                ? "bg-[#FAFAF7] text-neutral-500"
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
                        Need a hint or a quick explanation? Tap the button or
                        type a question for instant help.
                        <ChevronDown
                          className={`mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform ${hintOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {hintOpen && (
                        <div className="mt-3 space-y-3 space-x-2">
                          <Button variant="secondary" size="sm">
                            Give me a hint
                          </Button>
                          <Button variant="secondary" size="sm">
                            Explain further
                          </Button>

                          <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2">
                            <input
                              type="text"
                              placeholder="Ask your own question here..."
                              className="w-full text-sm outline-none placeholder:text-neutral-400"
                            />
                            <Button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-primary p-0! text-white">
                              <SendHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-white border-t border py-4 px-5 h-20 fixed w-full bottom-0">
                  <div className="max-w-container mx-auto flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      className=" text-neutral-700"
                      size="sm"
                    >
                      <Flag className="w-5 stroke-neutral-500" />
                      Report a mistake
                    </Button>
                    {currentIndex + 1 === loadedQuestions.length ? (
                      <Button
                        size="md"
                        disabled={!isAnswered || !isViewingFurthest}
                        onClick={() => setShowResults(true)}
                      >
                        See Results
                      </Button>
                    ) : (
                      <Button
                        size="md"
                        disabled={!isAnswered || !isViewingFurthest}
                        onClick={nextQuestion}
                      >
                        Next Question <ArrowRight />
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <PremiumDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
      />
    </WebLayoutProvider>
  );
}
