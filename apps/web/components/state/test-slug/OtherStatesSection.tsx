"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { State } from "@driving-test-app/shared";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";
import StateSelectModal from "@/components/home/StateSelectModal";
import { api } from "@/lib/api";
import { stateToSlug } from "@/lib/usStates";
import { useWebLayout } from "@/lib/web-layout-context";
import { ArrowRight } from "lucide-react";

const VISIBLE_STATES = 15;

/**
 * "Practice for your state" — a pill grid of the other states we publish tests for, each linking
 * to that state's hub (the per-test slug is state-specific, so it can't carry across). The count
 * in the sub-line and the button is the real published roster from GET /states, not a fixed
 * number.
 */
export default function OtherStatesSection() {
  const { selectedState } = useWebLayout();
  const [states, setStates] = useState<State[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ data: State[] }>("/states")
      .then((res) => {
        if (!cancelled) setStates(res.data);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const others = states.filter((state) => state.name !== selectedState);
  if (others.length === 0) return null;

  return (
    <section className="px-5 py-15 lg:py-30">
      <div className="mx-auto flex max-w-container flex-col items-center gap-8">
        <div className="flex max-w-205 flex-col items-center gap-6 text-center">
          <Heading as="h2" className="text-center">
            Practice for your state
          </Heading>
          <Paragraph size="xl" className="max-w-153.5 text-center">
            DriveLane covers permit and license tests in {states.length} states, each built from that
            state’s own manual.
          </Paragraph>
        </div>

        <div className="grid w-full grid-cols-2 gap-4 pt-4 sm:grid-cols-3 lg:grid-cols-5">
          {others.slice(0, VISIBLE_STATES).map((state) => (
            <Link
              key={state.code}
              href={`/${stateToSlug(state.name)}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-background3 dark:border-white/10 bg-white dark:bg-neutral-800 px-4.5 py-4.5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
            >
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{state.name}</span>
              <ArrowRight className="size-4 shrink-0 text-blue-500" />
            </Link>
          ))}
        </div>

        <Button className="to-blue-800!" onClick={() => setPickerOpen(true)}>
          See all {states.length} states <ArrowRight />
        </Button>
      </div>

      <StateSelectModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </section>
  );
}
