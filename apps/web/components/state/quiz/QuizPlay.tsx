"use client";

import { Bookmark, ChevronDown, ChevronLeft, EllipsisVertical, Flag, RotateCcw, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import Slider from "@/components/ui/Slider";
import Switch from "@/components/ui/Switch";
import PremiumDialog from "./PremiumDialog";
import QuestionCard from "./QuestionCard";
import type { QuizQuestionStatic } from "./types";

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

export default function QuizPlay({
  questions,
  currentIndex,
  furthestIndex,
  currentQuestion,
  selectedOptionId,
  isAnswered,
  isViewingFurthest,
  correctCount,
  incorrectCount,
  allowedToFail,
  questionStatuses,
  onExit,
  onRestart,
  onSelectOption,
  onGoToQuestion,
  onNextQuestion,
  onSeeResults,
}: {
  questions: QuizQuestionStatic[];
  currentIndex: number;
  furthestIndex: number;
  currentQuestion: QuizQuestionStatic;
  selectedOptionId: number | undefined;
  isAnswered: boolean;
  isViewingFurthest: boolean;
  correctCount: number;
  incorrectCount: number;
  allowedToFail: number;
  questionStatuses: ("correct" | "incorrect" | "unanswered")[];
  onExit: () => void;
  onRestart: () => void;
  onSelectOption: (optionId: number) => void;
  onGoToQuestion: (index: number) => void;
  onNextQuestion: () => void;
  onSeeResults: () => void;
}) {
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

  const questionFontScale = useMemo(() => 0.85 + (fontSize[0] / 100) * 0.45, [fontSize]);

  function handleBookmarkClick() {
    if (!isPremiumUser) {
      setShowPremiumDialog(true);
    }
  }

  return (
    <section className="my-10 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_333px]">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onExit}
            className="flex shrink-0 items-center gap-1 p-0! text-sm font-semibold"
          >
            <ChevronLeft className="h-4 w-4" />
            All tests
          </Button>

          <Paragraph size="sm" className="shrink-0 text-sm font-semibold" color="dark">
            {currentIndex + 1}/{questions.length}
          </Paragraph>

          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white">
            <div
              className="h-3 bg-linear-to-r from-blue-500 to-blue-700 transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <Button className="flex h-9 w-9 items-center justify-center p-0!" size="sm" onClick={handleBookmarkClick}>
            <Bookmark className="h-4 w-4" />
          </Button>

          <div className="relative" ref={settingsRef}>
            <Button
              className="flex h-9 w-9 items-center justify-center p-0!"
              size="sm"
              variant="secondary"
              onClick={() => setSettingsOpen((v) => !v)}
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>

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

        <QuestionCard
          question={currentQuestion}
          selectedOptionId={selectedOptionId}
          isAnswered={isAnswered}
          isLastQuestion={currentIndex === questions.length - 1}
          isViewingFurthest={isViewingFurthest}
          voiceOver={voiceOver}
          fontScale={questionFontScale}
          onSelectOption={onSelectOption}
          onNextQuestion={onNextQuestion}
          onSeeResults={onSeeResults}
        />
        <Button size="sm" variant="secondary" className="bg-white! font-normal! shadow">
          <Flag className="w-4 fill-neutral-500 stroke-neutral-500" />
          Report a mistake
        </Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-[#e5e7eb80] bg-white p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Paragraph size="xl" color="dark" className="font-bold">
              Your Progress
            </Paragraph>
            <Button variant="secondary" size="sm" onClick={onRestart}>
              <RotateCcw className="h-3.5 w-3.5" /> Restart
            </Button>
          </div>

          <Paragraph className="mb-4 flex items-center gap-4" size="xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <strong>{incorrectCount} </strong>
              Incorrect ({allowedToFail} allowed to pass)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <strong>{correctCount} </strong>
              Correct
            </span>
          </Paragraph>

          <div className="grid grid-cols-8 gap-1.5">
            {questions.map((question, index) => (
              <button
                key={question.id}
                disabled={index > furthestIndex}
                onClick={() => onGoToQuestion(index)}
                className={`flex aspect-square items-center justify-center rounded-md text-sm font-semibold ${
                  questionStatuses[index] === "correct" ? "bg-green-200 text-green-800" : ""
                } ${questionStatuses[index] === "incorrect" ? "bg-red-200 text-red-800" : ""} ${
                  questionStatuses[index] === "unanswered" ? "bg-neutral-100 text-neutral-500" : ""
                } ${index === furthestIndex || index === currentIndex ? "ring-2 ring-blue-primary" : ""} ${
                  index > furthestIndex ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#e5e7eb80] bg-white p-5 shadow-xl">
          <button
            onClick={() => setHintOpen((v) => !v)}
            className="flex w-full items-start justify-between gap-2 text-left text-sm text-neutral-600"
          >
            Need a hint or a quick explanation? Tap the button or type a question for instant help.
            <ChevronDown
              className={`mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform ${hintOpen ? "rotate-180" : ""}`}
            />
          </button>

          {hintOpen && (
            <div className="mt-3 space-y-3">
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

      <PremiumDialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog} />
    </section>
  );
}
