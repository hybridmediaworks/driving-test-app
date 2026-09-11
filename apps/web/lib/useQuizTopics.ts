"use client";

import { useQuizQuestions } from "@/lib/useQuizQuestions";

export type QuizTopic = {
  topic: string;
  /** How many of the quiz's questions come from this topic. */
  count: number;
  /** That topic's share of the whole test, as a whole percent. */
  share: number;
};

/** How many topics the breakdown shows. */
const TOP_TOPICS = 5;

/**
 * The topics a quiz leans on hardest, ranked by how many of its questions they account for.
 * Empty when the quiz's questions carry no topic (or aren't readable, e.g. a locked premium
 * test) — the breakdown section hides itself in that case, and the score-distribution card next
 * to it checks the same thing before overlapping the band the breakdown would have drawn.
 */
export function useQuizTopics(quizId: number | undefined): QuizTopic[] {
  const questions = useQuizQuestions(quizId);

  const counts = new Map<string, number>();
  for (const question of questions) {
    const topic = question.topic?.trim();
    if (!topic) continue;
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TOPICS)
    .map(([topic, count]) => ({
      topic,
      count,
      share: Math.round((count / questions.length) * 100),
    }));
}
