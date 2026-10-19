"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Layers } from "lucide-react";
import type { FlashcardSet } from "@driving-test-app/shared";
import HandUnderline from "@/components/ui/HandUnderline";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import { api } from "@/lib/api";
import { stateAbbreviations } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";

const vehicleSlugs: Record<string, string> = { Car: "car", Motorcycle: "motorcycle", CDL: "cdl" };

/** "regulatory-signs" -> "Regulatory signs" */
function topicLabel(topic: string): string {
  const spaced = topic.replace(/[-_]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function cardCount(count: number): string {
  return `${count} flashcard${count === 1 ? "" : "s"}`;
}

/**
 * The state page when the account menu's Study mode is "Flashcards": the same place the learner
 * would see the test ladder, but listing flashcard sets (grouped by category, one tile per topic)
 * with their card counts. Each tile opens a study session for exactly that set.
 */
export default function FlashcardSetsContent() {
  const { selectedState, selectedVehicle, setStudyMode } = useWebLayout();
  const stateCode = stateAbbreviations[selectedState] ?? "";
  const vehicleType = vehicleSlugs[selectedVehicle] ?? "car";
  const key = `${stateCode}|${vehicleType}`;

  const [loaded, setLoaded] = useState<{ key: string; sets: FlashcardSet[] | null } | null>(null);

  useEffect(() => {
    if (!stateCode) return;
    let cancelled = false;

    api
      .get<{ data: FlashcardSet[] }>(`/flashcards/sets?state=${stateCode}&vehicle_type=${vehicleType}`)
      .then((res) => {
        if (!cancelled) setLoaded({ key, sets: res.data });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, sets: null });
      });

    return () => {
      cancelled = true;
    };
  }, [stateCode, vehicleType, key]);

  const sets = loaded?.key === key ? loaded.sets : undefined;

  const groups = new Map<string, { title: string; sets: FlashcardSet[] }>();
  for (const set of sets ?? []) {
    const groupKey = set.category?.name ?? "general";
    const group = groups.get(groupKey) ?? { title: set.category?.title ?? "General", sets: [] };
    group.sets.push(set);
    groups.set(groupKey, group);
  }

  function studyHref(set: FlashcardSet): string {
    const params = new URLSearchParams({ state: stateCode, vehicle_type: vehicleType });
    if (set.category) params.set("category", set.category.name);
    if (set.topic) params.set("topic", set.topic);
    return `/flashcards/study?${params.toString()}`;
  }

  return (
    <section className="px-5 py-12 lg:py-16">
      <div className="mx-auto max-w-container">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-300 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:border-blue-400/40 dark:text-blue-300">
            <Layers className="size-4" aria-hidden /> Flashcard Mode
          </span>
          <Heading as="h1" size="xl" className="text-center">
            Let&apos;s prepare for your{" "}
            <span className="relative inline-block whitespace-nowrap">
              {selectedState}
              <HandUnderline />
            </span>{" "}
            DMV exam
          </Heading>
          <Paragraph size="xl" className="text-center">
            Quick-recall cards for {selectedState}, grouped by topic. Pick a set to start studying.
          </Paragraph>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setStudyMode("tests")}
              className="cursor-pointer text-blue-700 hover:underline dark:text-blue-300"
            >
              Switch to tests
            </button>
            <Link href="/flashcards" className="text-blue-700 hover:underline dark:text-blue-300">
              Browse all flashcards
            </Link>
          </div>
        </div>

        <div className="mt-12 space-y-10">
          {sets === undefined && <p className="text-center text-sm text-muted-foreground">Loading flashcards…</p>}

          {sets === null && (
            <p className="text-center text-sm text-muted-foreground">
              Couldn&apos;t load the flashcards right now. Please try again in a moment.
            </p>
          )}

          {sets && sets.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              No flashcards for {selectedState} yet. Switch to tests, or browse all flashcards.
            </p>
          )}

          {[...groups.entries()].map(([groupKey, group]) => (
            <div key={groupKey}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-sora text-xl font-semibold text-neutral-900 dark:text-neutral-100">{group.title}</h2>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {cardCount(group.sets.reduce((sum, set) => sum + set.count, 0))}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.sets.map((set) => (
                  <Link
                    key={`${groupKey}-${set.topic ?? "all"}`}
                    href={studyHref(set)}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-5 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-hover focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none dark:bg-neutral-800"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">
                        {set.topic ? topicLabel(set.topic) : `${group.title} flashcards`}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{cardCount(set.count)}</p>
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-blue-600 transition-transform group-hover:translate-x-0.5 dark:text-blue-400" aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
