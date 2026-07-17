"use client";

import { geoAlbersUsa } from "d3-geo";
import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import Heading from "@/components/ui/Heading";
import Paragraph from "@/components/ui/Paragraph";

// Colors match the "Activity Level" legend below the map.
// `normalizedValue` is 0-100, relative to the highest value in the current dataset —
// this keeps the buckets meaningful even when real (non 0-100) counts come from the backend.
function getActivityColor(normalizedValue: number) {
  if (normalizedValue > 80) return "#3b82f6"; // Very High
  if (normalizedValue > 60) return "#60a5fa"; // High
  if (normalizedValue > 40) return "#93c5fd"; // Medium
  if (normalizedValue > 20) return "#bfdbfe"; // Low
  return "#dbeafe"; // Very Low
}

const userData = [
  { name: "Alabama", value: 64 },
  { name: "Alaska", value: 12 },
  { name: "Arizona", value: 89 },
  { name: "Arkansas", value: 37 },
  { name: "California", value: 95 },
  { name: "Colorado", value: 53 },
  { name: "Connecticut", value: 41 },
  { name: "Delaware", value: 27 },
  { name: "District of Columbia", value: 68 },
  { name: "Florida", value: 76 },
  { name: "Georgia", value: 58 },
  { name: "Hawaii", value: 15 },
  { name: "Idaho", value: 33 },
  { name: "Illinois", value: 82 },
  { name: "Indiana", value: 46 },
  { name: "Iowa", value: 21 },
  { name: "Kansas", value: 39 },
  { name: "Kentucky", value: 57 },
  { name: "Louisiana", value: 44 },
  { name: "Maine", value: 18 },
  { name: "Maryland", value: 71 },
  { name: "Massachusetts", value: 84 },
  { name: "Michigan", value: 66 },
  { name: "Minnesota", value: 52 },
  { name: "Mississippi", value: 29 },
  { name: "Missouri", value: 61 },
  { name: "Montana", value: 11 },
  { name: "Nebraska", value: 25 },
  { name: "Nevada", value: 74 },
  { name: "New Hampshire", value: 19 },
  { name: "New Jersey", value: 88 },
  { name: "New Mexico", value: 36 },
  { name: "New York", value: 97 },
  { name: "North Carolina", value: 69 },
  { name: "North Dakota", value: 13 },
  { name: "Ohio", value: 78 },
  { name: "Oklahoma", value: 42 },
  { name: "Oregon", value: 55 },
  { name: "Pennsylvania", value: 91 },
  { name: "Rhode Island", value: 22 },
  { name: "South Carolina", value: 63 },
  { name: "South Dakota", value: 14 },
  { name: "Tennessee", value: 59 },
  { name: "Texas", value: 93 },
  { name: "Utah", value: 38 },
  { name: "Vermont", value: 17 },
  { name: "Virginia", value: 80 },
  { name: "Washington", value: 86 },
  { name: "West Virginia", value: 24 },
  { name: "Wisconsin", value: 47 },
  { name: "Wyoming", value: 10 },
  { name: "Puerto Rico", value: 72 },
];

export default function MapSection() {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    let disposed = false;

    // Keeps the canvas in sync with the container's actual box size —
    // including the mobile/desktop height switch below — instead of racing
    // React's render commit with a manually tracked height.
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(chartRef.current);

    chart.showLoading();

    (async () => {
      const res = await fetch("/maps/USA.json");
      const usaJson = await res.json();

      if (disposed) return;
      chart.hideLoading();

      echarts.registerMap("USA", usaJson);
      const projection = geoAlbersUsa();

      const maxValue = Math.max(...userData.map((d) => d.value));
      const mapData = userData.map((d) => ({
        ...d,
        itemStyle: {
          areaColor: getActivityColor((d.value / maxValue) * 100),
        },
      }));

      chart.setOption({
        tooltip: {
          trigger: "item",
          formatter: (params: { name: string; value?: number }) =>
            `${params.name}<br/>${params.value || 0} Active Now`,
          backgroundColor: "#1e293b",
          borderWidth: "0",
          borderRadius: "12",
          textStyle: { color: "#ffffff" },
        },
        series: [
          {
            name: "User Data",
            type: "map",
            map: "USA",
            layoutCenter: ["50%", "50%"],
            layoutSize: "157%",
            projection: {
              project: (point: [number, number]) => projection(point),
              unproject: (point: [number, number]) => projection.invert!(point),
            },
            data: mapData,
            label: {
              show: true,
              color: "#000",
              fontSize: 10,
              fontWeight: "bold",
              formatter: (params: { value?: number }) => (params.value ? `${params.value}` : ""),
            },
            emphasis: {
              label: { show: true, fontSize: 12 },
              itemStyle: { areaColor: "#fff" },
            },
            itemStyle: { borderColor: "#fff" },
          },
        ],
      });

      chart.on("click", (params) => {
        if (!params.name) return;
        const slug = params.name.toLowerCase().replace(/\s+/g, "-");
        window.location.href = `/states/${slug}`;
      });
    })();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, []);

  return (
    <section className="px-5 pb-15 lg:pt-15 lg:pb-30">
      <div className="mx-auto max-w-container space-y-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Paragraph
            className="mb-2 border-b border-blue-50 px-3.5 py-1.25 font-bold tracking-[1.2px] uppercase"
            size="xs"
            color="primary"
          >
            ✦ Helping drivers across the usa
          </Paragraph>
          <Heading as="h2" size="lg" className="font-bold!">
            Live across <span className="text-blue-500">America</span>
          </Heading>
          <Paragraph
            className="flex max-w-161 items-center gap-2 text-center font-semibold"
            size="xs"
          >
            <span className="h-3 w-3 rounded-full border-[3px] border-green-100 bg-green-600" />
            Live now —{" "}
            <span className="bg-green-100 px-2 py-0.5 text-green-600">
              4,813 practicing now on Drive Lane in 47 states
            </span>
          </Paragraph>
        </div>

        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between lg:gap-5">
          <div ref={chartRef} className="h-85 w-full max-w-[974px] lg:h-156.5" />

          <div className="w-full space-y-6 lg:w-auto lg:min-w-fit">
            <Paragraph className="text-center font-bold lg:text-left">Activity Level:</Paragraph>
            <div className="flex flex-wrap justify-center gap-4 lg:flex-col">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-blue-500" />
                <Paragraph className="font-semibold">Very High</Paragraph>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-blue-400" />
                <Paragraph className="font-semibold">High</Paragraph>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-blue-300" />
                <Paragraph className="font-semibold">Medium</Paragraph>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-blue-200" />
                <Paragraph className="font-semibold">Low</Paragraph>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded bg-blue-100" />
                <Paragraph className="font-semibold">Very Low</Paragraph>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
