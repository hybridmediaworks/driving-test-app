"use client";

import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { stateToSlug } from "@/lib/usStates";
import { useQuizQuestions } from "@/lib/useQuizQuestions";
import { useResolvedQuiz } from "@/lib/useResolvedQuiz";
import { useStateStats } from "@/lib/useStateStats";
import { useWebLayout } from "@/lib/web-layout-context";
import { ArrowRight } from "lucide-react";

/**
 * "Where {state} test takers struggle most" — the ranked topic list from Figma. The share shown on
 * the right is each topic's real weight in this test (its questions ÷ all questions), read from
 * the quiz's own questions. A true per-topic miss rate would need a graded-answer analytics
 * endpoint, which the API doesn't expose yet.
 */
export default function TopicBreakdownSection({ testSlug }: { testSlug: string }) {
  const { selectedState } = useWebLayout();
  const stateSlug = stateToSlug(selectedState);
  const quiz = useResolvedQuiz(testSlug);
  const questions = useQuizQuestions(quiz?.id);
  const stats = useStateStats();

  const counts = new Map<string, number>();
  for (const question of questions) {
    const topic = question.topic?.trim();
    if (!topic) continue;
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }

  const topics = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({
      topic,
      count,
      share: Math.round((count / questions.length) * 100),
    }));

  if (topics.length === 0) return null;

  return (
    // The tinted band runs 376px past the last card: the score-distribution card that follows is
    // pulled up into it so it straddles the colour change, exactly as in Figma.
    <section className="bg-background2 px-5 py-15 lg:pt-30 lg:pb-94">
      <div className="mx-auto max-w-container">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="space-y-4">
            <Heading as="h2" className="max-w-172.5">
              Where {selectedState} test takers struggle most
            </Heading>
            <Paragraph size="xl" className="max-w-181.5">
              {stats
                ? `Based on ${stats.students_practiced_30d.toLocaleString()} ${selectedState} learners who practiced on our site in the last 30 days.`
                : `Based on ${selectedState} learners practicing on our site.`}{" "}
              These are the topics {quiz?.title ?? "this test"} leans on hardest.
            </Paragraph>
          </div>
          <Button className="shrink-0 to-blue-800!" href={`/${stateSlug}/${testSlug}/quiz`}>
            Drill these topics free <ArrowRight />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-5 pt-12 lg:grid-cols-2">
          {topics.map((entry, index) => (
            <article
              key={entry.topic}
              className="flex items-start gap-6 rounded-2xl border border-background3 dark:border-white/10 bg-white dark:bg-neutral-800 p-6.25 drop-shadow-[0px_1px_1px_rgba(14,17,22,0.06),0px_2px_3px_rgba(14,17,22,0.05)]"
            >
              <span className="flex size-16 shrink-0 items-center justify-center rounded-[11px] border border-red-300 bg-red-50 dark:bg-red-500/10 font-sora text-2xl leading-6 font-semibold tracking-[-0.48px] text-neutral-900 dark:text-neutral-100">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 space-y-2">
                <h3 className="font-sora text-2xl leading-8 font-semibold text-neutral-900 dark:text-neutral-100">
                  {entry.topic}
                </h3>
                <Paragraph>
                  {entry.count} of the {questions.length} questions on this test come from this topic — get it wrong
                  here and it costs you the same points it would at the DMV.
                </Paragraph>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-sora text-3xl leading-9.5 font-semibold tracking-[-0.6px] text-red-500">
                  {entry.share}%
                </p>
                <Paragraph size="sm" className="text-right">
                  of this test
                </Paragraph>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
