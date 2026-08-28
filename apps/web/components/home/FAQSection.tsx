"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { cn } from "@/lib/utils";

/**
 * "Frequently asked questions" — a two-column layout: heading + category selector
 * on the left, and the numbered accordion for the active category on the right.
 * Pixel-matched to Figma node 1976:6942 (file QOJ34F4OPHkJ5LFrJt9eCA).
 */
type Faq = { question: string; answer: string };
type Category = { name: string; items: Faq[] };

const CATEGORIES: Category[] = [
  {
    name: "Knowledge Test",
    items: [
      {
        question: "Tips for taking knowledge test",
        answer:
          "Focus on Key Areas (Traffic Laws, Road Signs, Alcohol and Drugs, Parking Rules); Read Questions Carefully; Eliminate Obviously Incorrect Options; Review Your Answers and Arrive Early",
      },
      {
        question: "Tips for taking DMV tests",
        answer:
          "Practice regularly with mock tests, arrive early on test day, bring all required documents, stay calm and read each question carefully before answering.",
      },
      {
        question: "What happens if you fail the test?",
        answer:
          "If you fail, you may retake the test after a waiting period (typically 1–7 days depending on your state). Some states limit the number of attempts before requiring additional fees.",
      },
      {
        question:
          "What are the total number of questions and the passing score for car written test",
        answer:
          "The number of questions varies by state, typically ranging from 20 to 46. The passing score is usually 70–80% correct answers depending on your state's requirements.",
      },
      {
        question:
          "How long to wait before retaking the written test and road test",
        answer:
          "Waiting periods vary by state. For the written test it is typically 1–7 days; for the road test it can range from 1 day to 2 weeks after a failed attempt.",
      },
      {
        question: "How to review your weak topic?",
        answer:
          "After each practice test, the app highlights the categories where you missed questions. Focus your study time on those sections using our topic-specific practice modules.",
      },
    ],
  },
  {
    name: "Booking and DMV",
    items: [
      {
        question: "Is the app available in Spanish",
        answer:
          "Yes, our app supports Spanish and several other languages. You can switch the language from the settings menu inside the app.",
      },
      {
        question: "Do I have to make an appointment to apply for the test",
        answer:
          "Most DMV offices require an appointment. You can schedule one online through the official DMV website or call your local office directly.",
      },
    ],
  },
  {
    name: "Courses",
    items: [
      {
        question: "How does the Motorcycle course work?",
        answer:
          "The motorcycle course covers traffic laws specific to motorcycles, safe riding techniques, and hazard awareness. It includes practice questions modeled after the official motorcycle knowledge test.",
      },
      {
        question: "How does the CDL course work?",
        answer:
          "The CDL course prepares you for the Commercial Driver's License exam, covering general knowledge, air brakes, combination vehicles, and endorsements like hazmat and tanker.",
      },
      {
        question: "How does online driver's license course work?",
        answer:
          "Our online course lets you study at your own pace with video lessons, interactive quizzes, and full-length practice tests that mirror the actual DMV exam.",
      },
    ],
  },
];

export default function FAQSection({ className }: { className?: string }) {
  const [activeCat, setActiveCat] = useState(0);
  const [openIndex, setOpenIndex] = useState(0);

  const items = CATEGORIES[activeCat].items;

  return (
    <section className={cn("bg-background px-5 py-16 lg:py-[120px]", className)}>
      <div className="mx-auto grid max-w-container grid-cols-1 gap-10 lg:grid-cols-[482fr_785fr] lg:items-start lg:gap-[60px]">
        {/* Left — heading + category tabs */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-start gap-8">
            <p className="flex items-center gap-1.5 border-b border-blue-100 px-[14px] pt-[5px] pb-[6px] text-xs font-bold tracking-[1.2px] text-blue-700 uppercase">
              <span aria-hidden="true">✦</span>
              How we help
            </p>
            <Heading as="h2">Frequently asked questions</Heading>
          </div>

          <div className="flex flex-col gap-5">
            {CATEGORIES.map((cat, i) => {
              const active = i === activeCat;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setActiveCat(i);
                    setOpenIndex(0);
                  }}
                  className={cn(
                    "flex h-[60px] items-center justify-between rounded-[24px] px-4 text-lg font-semibold transition-colors",
                    active
                      ? "bg-blue-600 text-white"
                      : "border border-background4 bg-white text-[#0b0b0d] hover:bg-neutral-50",
                  )}
                >
                  <span>{cat.name}</span>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      active ? "text-background2" : "text-neutral-500",
                    )}
                  >
                    {String(cat.items.length).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — accordion for the active category */}
        <div className="rounded-[24px] bg-white p-6 sm:p-10 lg:p-[60px]">
          <div className="flex flex-col gap-5">
            {items.map((faq, index) => {
              const open = index === openIndex;
              const isLast = index === items.length - 1;
              return (
                <div
                  key={faq.question}
                  className={cn(
                    "flex gap-3 pb-5",
                    !isLast && "border-b-2",
                    open ? "border-blue-500" : "border-blue-100",
                    isLast && "border-b-0 pb-0",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base text-blue-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenIndex(open ? -1 : index)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span className="flex-1 text-xl leading-[30px] font-semibold text-neutral-700">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-6 shrink-0 text-neutral-400 transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </button>
                    {open && (
                      <Paragraph className="font-medium text-neutral-500!">
                        {faq.answer}
                      </Paragraph>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
