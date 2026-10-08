"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

export type BreakdownRow = { label: string; value: number; color: string };

/**
 * A horizontal bar row — library counts, attempt split, anything where the question is "how do
 * these few compare". Rounded data-ends anchored to the baseline, values printed at the end of
 * each bar rather than on an axis, and no gridlines: with four or fewer rows an axis is scaffolding
 * for a comparison the eye already makes.
 */
export default function BarBreakdown({
  rows,
  height = 160,
}: {
  rows: BreakdownRow[];
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || rows.length === 0) return;

    const dark = document.documentElement.classList.contains("dark");
    const ink = dark ? "#c3c2b7" : "#52514e";
    const strong = dark ? "#ffffff" : "#0b0b0b";

    const chart = echarts.init(node, undefined, { renderer: "svg" });

    chart.setOption({
      animation: !reduced,
      animationDuration: 800,
      animationEasing: "cubicOut",
      grid: { left: 0, right: 56, top: 4, bottom: 4, containLabel: true },
      tooltip: {
        trigger: "item",
        backgroundColor: dark ? "#111827" : "#ffffff",
        borderColor: dark ? "#2e2e2c" : "#e9e8e4",
        textStyle: { color: strong, fontSize: 12 },
        extraCssText:
          "border-radius:12px; box-shadow:0 12px 32px rgba(16,24,40,0.16);",
        formatter: (p: { name: string; value: number }) =>
          `${p.name}<br/><strong>${p.value.toLocaleString()}</strong>`,
      },
      xAxis: { type: "value", show: false },
      yAxis: {
        type: "category",
        // Top to bottom in the order given, which echarts otherwise reverses.
        data: rows.map((r) => r.label).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: ink, fontSize: 12 },
      },
      series: [
        {
          type: "bar",
          barWidth: 10,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: (p: { dataIndex: number }) =>
              [...rows].reverse()[p.dataIndex].color,
          },
          label: {
            show: true,
            position: "right",
            distance: 10,
            color: strong,
            fontSize: 12,
            fontWeight: 600,
            formatter: (p: { value: number }) => p.value.toLocaleString(),
          },
          data: [...rows].reverse().map((r) => r.value),
        },
      ],
    });

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [rows, reduced]);

  return <div ref={ref} style={{ height }} className="w-full" />;
}
