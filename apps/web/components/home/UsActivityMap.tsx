"use client";

import { geoAlbersUsa } from "d3-geo";
import * as echarts from "echarts";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  activityBuckets,
  activityColor,
  numberFormat,
  stateActivity,
  type StateActivity,
} from "@/components/home/stateActivity";
import { stateToSlug } from "@/lib/usStates";

type MapDatum = StateActivity & {
  value: number;
  itemStyle: { areaColor: string };
};

const mapData: MapDatum[] = stateActivity.map((state) => ({
  ...state,
  value: state.intensity,
  itemStyle: { areaColor: activityColor(state.intensity) },
}));

const pins = stateActivity
  .filter((state): state is StateActivity & { pin: [number, number] } => Boolean(state.pin))
  .map((state) => ({ name: state.name, coord: state.pin }));

const topStates = [...stateActivity].sort((a, b) => b.practicing - a.practicing).slice(0, 5);

function tooltipMarkup(state: MapDatum): string {
  return `
    <div style="min-width:140px">
      <div style="font-size:14px;font-weight:600;color:var(--foreground)">${state.name}</div>
      <div style="margin-top:4px;font-size:13px;color:var(--muted-foreground)">
        <span style="color:var(--chart-1);font-weight:600">${numberFormat.format(
          state.practicing,
        )}</span>
        drivers practicing
      </div>
      <div style="margin-top:2px;font-size:12px;font-weight:500;color:var(--status-good)">
        &#8593; +${state.trend}% this week
      </div>
    </div>
  `;
}

export default function UsActivityMap() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    let disposed = false;

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartRef.current);

    chart.showLoading({ text: "", maskColor: "transparent", showSpinner: false });

    (async () => {
      const res = await fetch("/maps/USA.json");
      const usaJson = await res.json();

      if (disposed) return;
      chart.hideLoading();

      echarts.registerMap("USA", usaJson);
      const projection = geoAlbersUsa();

      chart.setOption({
        tooltip: {
          trigger: "item",
          backgroundColor: "var(--card)",
          borderWidth: 0,
          padding: [10, 14],
          extraCssText: "border-radius:12px;box-shadow:0 12px 32px -12px rgba(16,24,40,0.28);",
          formatter: (params: { data?: MapDatum }) =>
            params.data ? tooltipMarkup(params.data) : "",
        },
        series: [
          {
            name: "Drivers practicing",
            type: "map",
            map: "USA",
            cursor: "pointer",
            layoutCenter: ["50%", "50%"],
            layoutSize: "157%",
            projection: {
              project: (point: [number, number]) => projection(point),
              unproject: (point: [number, number]) => projection.invert!(point),
            },
            data: mapData,
            label: { show: false },
            itemStyle: { borderColor: "#ffffff", borderWidth: 1 },
            emphasis: {
              label: { show: false },
              itemStyle: { areaColor: "#1d4ed8" },
            },
            select: { disabled: true },
            markPoint: {
              silent: true,
              symbol: "pin",
              symbolSize: 26,
              symbolOffset: [0, -2],
              label: { show: false },
              itemStyle: {
                color: "#2563eb",
                borderColor: "#ffffff",
                borderWidth: 2,
                shadowBlur: 8,
                shadowColor: "rgba(37,99,235,0.35)",
              },
              data: pins,
            },
          },
        ],
      });

      chart.on("click", (params) => {
        if (!params.name) return;
        router.push(`/${stateToSlug(params.name)}`);
      });
    })();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <div
        role="img"
        aria-label="Map of the United States, shaded by how many drivers are practicing in each state."
      >
        <div ref={chartRef} aria-hidden className="h-65 w-full sm:h-85 lg:h-110 xl:h-125" />
      </div>

      {}
      <ul className="sr-only">
        {topStates.map((state) => (
          <li key={state.name}>
            {state.name}: {numberFormat.format(state.practicing)} drivers practicing, up{" "}
            {state.trend}% this week.
          </li>
        ))}
      </ul>

      <ul aria-label="Activity level" className="mx-auto flex max-w-md gap-1.5">
        {activityBuckets.map((bucket) => (
          <li key={bucket.label} className="flex-1 space-y-2 text-center">
            <span
              aria-hidden
              className="block h-2.5 rounded-full"
              style={{ backgroundColor: bucket.color }}
            />
            <span className="block text-[11px] font-medium text-neutral-500 sm:text-xs dark:text-neutral-400">
              {bucket.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
