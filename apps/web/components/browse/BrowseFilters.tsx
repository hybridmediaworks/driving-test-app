"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { QuizCategory, State, VehicleType } from "@driving-test-app/shared";
import Spinner from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Every filter a browse page can offer. A page passes the subset it supports, in display order. */
export type BrowseField = "state" | "vehicle_type" | "test_track" | "category";

type Option = { value: string; label: string };

/**
 * The three option lists every browse page needs, fetched once per mount.
 *
 * Each list page used to make these same three calls inline; keeping them here means a page that
 * adopts this filter bar stops making them at all.
 */
function useFilterOptions(): Record<BrowseField, Option[]> {
  const [states, setStates] = useState<State[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [categories, setCategories] = useState<QuizCategory[]>([]);

  useEffect(() => {
    api.get<{ data: State[] }>("/states").then((res) => setStates(res.data));
    api.get<{ data: VehicleType[] }>("/vehicle-types").then((res) => setVehicleTypes(res.data));
    api.get<{ data: QuizCategory[] }>("/quiz-categories").then((res) => setCategories(res.data));
  }, []);

  return {
    state: states.map((s) => ({ value: s.code, label: s.name })),
    vehicle_type: vehicleTypes.map((v) => ({ value: v.name, label: v.title })),
    category: categories.map((c) => ({ value: c.name, label: c.title })),
    test_track: [
      { value: "permit_test", label: "Permit Test" },
      { value: "driving_test", label: "Driving Test" },
    ],
  };
}

const PLACEHOLDER: Record<BrowseField, string> = {
  state: "All states",
  vehicle_type: "All vehicles",
  test_track: "All test tracks",
  category: "All categories",
};

/**
 * A search box the learner types into freely, pushed to the URL once they pause.
 *
 * The input keeps its own value rather than reading the URL every keystroke: `updateFilter`
 * navigates, and a navigation per character makes the field feel like it is fighting back. The URL
 * stays the source of truth — it is just updated at the speed of thought instead of typing.
 */
function SearchBox({
  value,
  onChange,
  loading,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  loading: boolean;
  placeholder: string;
}) {
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);
  // The parent hands a fresh `onChange` every render, and this debounce must not depend on its
  // identity: a re-render while the learner is mid-word would restart the timer, so a page that
  // re-renders faster than the delay would never commit the search at all.
  const commit = useRef(onChange);
  useEffect(() => {
    commit.current = onChange;
  }, [onChange]);

  // Back/forward, or a cleared chip, change the URL without the input knowing. Adopt the incoming
  // value only when it differs from what this box last pushed, so a reload mid-typing doesn't
  // yank the caret back.
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (draft === committed.current) return;
    const timer = setTimeout(() => {
      committed.current = draft;
      commit.current(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft]);

  return (
    <div className="relative flex-1">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-card pr-11 pl-10 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-chart-1 focus-visible:ring-3 focus-visible:ring-chart-1/25"
      />
      {/* Sits where a result count would — the one place the eye is already looking while waiting. */}
      {loading && <Spinner className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground" />}
    </div>
  );
}

/** One applied filter, shown as something you can take off again. */
function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-chart-1/30 bg-chart-1/10 py-1 pr-1.5 pl-3 text-xs font-medium text-foreground transition-colors hover:bg-chart-1/20 focus-visible:ring-2 focus-visible:ring-chart-1 focus-visible:outline-none"
    >
      {label}
      <X aria-hidden className="size-3.5" />
      <span className="sr-only">Remove this filter</span>
    </button>
  );
}

/**
 * The filter bar shared by the public browse pages: a search box, one native select per field, and
 * a row of chips for whatever is currently applied.
 *
 * The selects stay native on purpose. A custom popup looks tidier in a screenshot, but picking one
 * of fifty-one states on a phone is genuinely faster through the OS's own picker.
 */
export default function BrowseFilters({
  fields,
  searchParams,
  updateFilter,
  updateFilters,
  loading,
  searchPlaceholder,
}: {
  fields: BrowseField[];
  searchParams: URLSearchParams;
  updateFilter: (key: string, value: string) => void;
  /** Needed for "Clear all" — several keys have to go in one navigation, not one call each. */
  updateFilters: (patch: Record<string, string>) => void;
  /** Drives the spinner inside the search box, so typing has visible feedback. */
  loading: boolean;
  searchPlaceholder: string;
}) {
  const options = useFilterOptions();

  const applied = fields
    .map((field) => {
      const value = searchParams.get(field);
      if (!value) return null;
      const label = options[field].find((o) => o.value === value)?.label ?? value;
      return { field, label };
    })
    .filter((chip): chip is { field: BrowseField; label: string } => chip !== null);

  const search = searchParams.get("search") ?? "";

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchBox
          value={search}
          onChange={(next) => updateFilter("search", next)}
          loading={loading}
          placeholder={searchPlaceholder}
        />
        <div className={cn("grid flex-1 gap-3", fields.length > 2 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2")}>
          {fields.map((field) => (
            <select
              key={field}
              value={searchParams.get(field) ?? ""}
              onChange={(e) => updateFilter(field, e.target.value)}
              aria-label={PLACEHOLDER[field]}
              className="h-11 min-w-0 rounded-xl border border-border bg-card px-3 text-sm transition-colors outline-none focus-visible:border-chart-1 focus-visible:ring-3 focus-visible:ring-chart-1/25"
            >
              <option value="">{PLACEHOLDER[field]}</option>
              {options[field].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {(applied.length > 0 || search) && (
        <div className="flex flex-wrap items-center gap-2">
          {search && <FilterChip label={`"${search}"`} onClear={() => updateFilter("search", "")} />}
          {applied.map((chip) => (
            <FilterChip key={chip.field} label={chip.label} onClear={() => updateFilter(chip.field, "")} />
          ))}
          {applied.length + (search ? 1 : 0) > 1 && (
            <button
              type="button"
              onClick={() => updateFilters({ search: "", ...Object.fromEntries(fields.map((field) => [field, ""])) })}
              className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
