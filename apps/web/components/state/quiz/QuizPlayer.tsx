"use client";

import { useMemo, useState } from "react";
import QuizPlay from "./QuizPlay";
import QuizResults from "./QuizResults";
import type { QuizQuestionStatic } from "./types";

const questions: QuizQuestionStatic[] = [
  {
    id: 1,
    category: "Signs & Signals",
    question: "Which of the following statements about pavement markings is FALSE?",
    img: "/driving-tests.jpg",
    options: [
      {
        id: 1,
        text: "You are allowed to cross a double solid yellow line to make a left turn into or from another roadway.",
        isCorrect: false,
        explanation:
          "This statement is true, not false - drivers may cross a double solid yellow line only to turn left into or out of a driveway or side street.",
      },
      {
        id: 2,
        text: "A broken white line separates two lanes of traffic moving in the same direction.",
        isCorrect: false,
        explanation:
          "A broken white line is used to separate lanes of traffic moving in the same direction, and drivers are allowed to change lanes when it is safe to do so. In some cases, a broken white line may separate a bicycle lane from a motor vehicle lane.",
      },
      {
        id: 3,
        text: "A broken yellow line separates two lanes of traffic moving in opposite directions.",
        isCorrect: false,
        explanation:
          "This statement is true, not false - a broken yellow line marks lanes of traffic traveling in opposite directions and allows passing when safe.",
      },
      {
        id: 4,
        text: "You are allowed to cross a double solid white line.",
        isCorrect: true,
        explanation:
          "This is FALSE - a double solid white line indicates that lane changes are discouraged or prohibited, so drivers should not cross it.",
      },
    ],
  },
  {
    id: 2,
    category: "Right of Way",
    question: "At an intersection with no signs or signals, who has the right of way?",
    options: [
      {
        id: 1,
        text: "The vehicle on the left",
        isCorrect: false,
        explanation: "The vehicle on the left must yield to the vehicle on the right at an uncontrolled intersection.",
      },
      {
        id: 2,
        text: "The vehicle on the right",
        isCorrect: true,
        explanation:
          "When two vehicles arrive at an uncontrolled intersection at about the same time, the driver on the left must yield to the driver on the right.",
      },
      {
        id: 3,
        text: "Whichever vehicle arrives first, regardless of position",
        isCorrect: false,
        explanation:
          "Arrival order matters only when it clearly establishes who reached the intersection first; otherwise the right-hand rule applies.",
      },
      {
        id: 4,
        text: "The larger vehicle",
        isCorrect: false,
        explanation: "Vehicle size has no bearing on right-of-way rules at an uncontrolled intersection.",
      },
    ],
  },
  {
    id: 3,
    category: "Speed Limits",
    question: "Unless posted otherwise, what is the speed limit in a business or residential district?",
    options: [
      {
        id: 1,
        text: "15 mph",
        isCorrect: false,
        explanation: "15 mph is the typical limit near schools during recess or arrival/dismissal, not the general district limit.",
      },
      {
        id: 2,
        text: "25 mph",
        isCorrect: true,
        explanation: "Unless otherwise posted, the default speed limit in business and residential districts is 25 mph.",
      },
      {
        id: 3,
        text: "35 mph",
        isCorrect: false,
        explanation: "35 mph is above the default limit for business and residential districts.",
      },
      {
        id: 4,
        text: "45 mph",
        isCorrect: false,
        explanation: "45 mph is a highway-range speed, well above what is allowed in residential or business districts by default.",
      },
    ],
  },
  {
    id: 4,
    category: "Alcohol & Drugs",
    question: "What is the legal blood alcohol concentration (BAC) limit for drivers 21 and older?",
    options: [
      {
        id: 1,
        text: "0.02%",
        isCorrect: false,
        explanation: "0.02% is the limit typically applied to drivers under 21, not the general adult limit.",
      },
      {
        id: 2,
        text: "0.08%",
        isCorrect: true,
        explanation: "For drivers 21 and older, it is illegal to operate a vehicle with a BAC of 0.08% or higher.",
      },
      {
        id: 3,
        text: "0.10%",
        isCorrect: false,
        explanation: "0.10% exceeds the legal limit for drivers 21 and older.",
      },
      {
        id: 4,
        text: "0.12%",
        isCorrect: false,
        explanation: "0.12% is well above the legal limit for drivers 21 and older.",
      },
    ],
  },
  {
    id: 5,
    category: "Parking",
    question: "How far must you park from a fire hydrant unless otherwise posted?",
    options: [
      {
        id: 1,
        text: "5 feet",
        isCorrect: false,
        explanation: "5 feet is closer than the minimum required clearance from a fire hydrant.",
      },
      {
        id: 2,
        text: "10 feet",
        isCorrect: true,
        explanation: "Unless otherwise posted, you must park at least 10 feet away from a fire hydrant.",
      },
      {
        id: 3,
        text: "15 feet",
        isCorrect: false,
        explanation: "15 feet is more than the minimum required distance, though never parking closer than 10 feet is still legal.",
      },
      {
        id: 4,
        text: "20 feet",
        isCorrect: false,
        explanation: "20 feet is not the standard required clearance from a fire hydrant.",
      },
    ],
  },
  {
    id: 6,
    category: "Sharing the Road",
    question: "When passing a cyclist, how much clearance should you give them?",
    options: [
      {
        id: 1,
        text: "At least 1 foot",
        isCorrect: false,
        explanation: "1 foot does not provide enough of a safety buffer when passing a cyclist.",
      },
      {
        id: 2,
        text: "At least 3 feet",
        isCorrect: true,
        explanation: "Drivers must leave a minimum of 3 feet of clearance when passing a cyclist sharing the road.",
      },
      {
        id: 3,
        text: "No clearance is required as long as you slow down",
        isCorrect: false,
        explanation: "Slowing down does not remove the requirement to leave adequate clearance when passing a cyclist.",
      },
      {
        id: 4,
        text: "Only pass in a designated bike lane",
        isCorrect: false,
        explanation: "Bike lanes are for cyclists, not for vehicles to use when passing.",
      },
    ],
  },
];

const allowedToFail = 4;
const totalQuestionPool = 500;

export default function QuizPlayer({
  stateName = "Alaska",
  showResults,
  onShowResultsChange,
  onExit,
}: {
  stateName?: string;
  showResults: boolean;
  onShowResultsChange: (value: boolean) => void;
  onExit: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const isViewingFurthest = currentIndex === furthestIndex;
  const currentQuestion = questions[currentIndex];
  const selectedOptionId = answers[currentQuestion.id];
  const isAnswered = selectedOptionId !== undefined;

  const correctCount = useMemo(
    () =>
      questions.filter((q) => {
        const pick = answers[q.id];
        return pick !== undefined && q.options.find((o) => o.id === pick)?.isCorrect;
      }).length,
    [answers],
  );

  const incorrectCount = useMemo(
    () =>
      questions.filter((q) => {
        const pick = answers[q.id];
        return pick !== undefined && !q.options.find((o) => o.id === pick)?.isCorrect;
      }).length,
    [answers],
  );

  const missedCategories = useMemo(
    () =>
      questions
        .filter((q) => {
          const pick = answers[q.id];
          return pick !== undefined && !q.options.find((o) => o.id === pick)?.isCorrect;
        })
        .map((q) => q.category)
        .filter((category, index, all) => all.indexOf(category) === index),
    [answers],
  );

  const visibleRiskAreas = missedCategories.slice(0, 3);
  const extraRiskAreaCount = Math.max(0, missedCategories.length - visibleRiskAreas.length);

  function questionStatus(question: QuizQuestionStatic): "correct" | "incorrect" | "unanswered" {
    const pick = answers[question.id];
    if (pick === undefined) return "unanswered";
    return question.options.find((o) => o.id === pick)?.isCorrect ? "correct" : "incorrect";
  }

  const questionStatuses = questions.map((q) => questionStatus(q));

  function selectOption(optionId: number) {
    if (isAnswered) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  }

  function goToQuestion(index: number) {
    if (index > furthestIndex) return;
    setCurrentIndex(index);
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      if (next > furthestIndex) setFurthestIndex(next);
    }
  }

  function restart() {
    setAnswers({});
    setCurrentIndex(0);
    setFurthestIndex(0);
    onShowResultsChange(false);
  }

  if (showResults) {
    return (
      <QuizResults
        stateName={stateName}
        incorrectCount={incorrectCount}
        questionsLength={questions.length}
        totalQuestionPool={totalQuestionPool}
        riskAreas={visibleRiskAreas}
        extraRiskAreaCount={extraRiskAreaCount}
        onExit={onExit}
      />
    );
  }

  return (
    <QuizPlay
      questions={questions}
      currentIndex={currentIndex}
      furthestIndex={furthestIndex}
      currentQuestion={currentQuestion}
      selectedOptionId={selectedOptionId}
      isAnswered={isAnswered}
      isViewingFurthest={isViewingFurthest}
      correctCount={correctCount}
      incorrectCount={incorrectCount}
      allowedToFail={allowedToFail}
      questionStatuses={questionStatuses}
      onExit={onExit}
      onRestart={restart}
      onSelectOption={selectOption}
      onGoToQuestion={goToQuestion}
      onNextQuestion={nextQuestion}
      onSeeResults={() => onShowResultsChange(true)}
    />
  );
}
