"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import type { AdminStats } from "@driving-test-app/shared";

type TopStates = AdminStats["activity"]["top_states_last_7_days"];

/**
 * Categorical slots in fixed order — slot 1 is always the busiest state, slot 2 the next, and so
 * on. They are never cycled and never reassigned by rank within a render: a state keeps the colour
 * it was given for as long as it is on the chart.
 *
 * Both sets are validated against their own surface (OKLab CVD separation, chroma, lightness band,
 * contrast) rather than the dark set being a lightened flip of the light one.
 */
const SERIES_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const SERIES_DARK = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];

function lastSevenDayLabels(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString(undefined, { weekday: "short" });
  });
}

/**
 * Attempts per day over the last week for the five busiest states.
 *
 * Five lines is the most this plot can carry and stay readable; the table underneath is not
 * decoration but the chart's other half. It names every series beside its colour, so identity
 * never rests on hue alone, and it carries the combined figure for the forty-seven states the
 * plot leaves out — without which five lines quietly imply that nowhere else is busy.
 */
export default function StateActivityChart({ data }: { data: TopStates }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || data.states.length === 0) return;

    const dark = document.documentElement.classList.contains("dark");
    const palette = dark ? SERIES_DARK : SERIES_LIGHT;
    const ink = dark ? "#c3c2b7" : "#52514e";
    const grid = dark ? "#2e2e2c" : "#e9e8e4";

    const chart = echarts.init(node, undefined, { renderer: "svg" });

    chart.setOption({
      color: palette,
      animation: !reduced,
      animationDuration: 900,
      animationEasing: "cubicOut",
      grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: grid } },
        backgroundColor: dark ? "#111827" : "#ffffff",
        borderColor: grid,
        textStyle: { color: dark ? "#ffffff" : "#0b0b0b", fontSize: 12 },
        extraCssText:
          "border-radius:12px; box-shadow:0 12px 32px rgba(16,24,40,0.16);",
      },
      xAxis: {
        type: "category",
        data: lastSevenDayLabels(),
        boundaryGap: false,
        axisLine: { lineStyle: { color: grid } },
        axisTick: { show: false },
        axisLabel: { color: ink, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: grid } },
        axisLabel: { color: ink, fontSize: 11 },
      },
      series: data.states.map((state) => ({
        name: state.name,
        type: "line",
        // Straight segments, not a spline. Smoothing invents a curve between two readings, and at
        // these counts — a 4 one day and a 0 the next — that curve reads as a gentle trend when
        // what actually happened was one busy day. The chart would be flattering the data.
        smooth: false,
        showSymbol: false,
        // 8px on hover: the mark has to be easy to hit, not just easy to see.
        symbolSize: 8,
        lineStyle: { width: 2 },
        emphasis: { focus: "series" },
        data: state.daily,
      })),
    });

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [data, reduced]);

  if (data.states.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No tests taken anywhere in the last seven days.
      </p>
    );
  }

  const palette = SERIES_LIGHT;

  return (
    <div className="space-y-4">
      <div ref={ref} className="h-[280px] w-full" />

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">State</th>
            <th className="pb-2 text-right font-medium">Tests, 7 days</th>
          </tr>
        </thead>
        <tbody>
          {data.states.map((state, index) => (
            <tr key={state.code} className="border-t border-border/60">
              <td className="py-2">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full dark:hidden"
                    style={{ backgroundColor: palette[index] }}
                  />
                  <span
                    aria-hidden
                    className="hidden size-2.5 shrink-0 rounded-full dark:block"
                    style={{ backgroundColor: SERIES_DARK[index] }}
                  />
                  {state.name}
                </span>
              </td>
              <td className="py-2 text-right tabular-nums">
                {state.total.toLocaleString()}
              </td>
            </tr>
          ))}
          <tr className="border-t border-border/60 text-muted-foreground">
            <td className="py-2">Everywhere else</td>
            <td className="py-2 text-right tabular-nums">
              {data.others_total.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
