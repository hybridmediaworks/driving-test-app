"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const values = [5, 2, 6.5, 4, 7, 5, 6.5, 4.5, 5.5, 3.5, 6, 9, 11, 9.5, 12, 7];

function last30DayLabels(count: number): string[] {
  const today = new Date();
  const step = 29 / (count - 1);

  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.round((count - 1 - i) * step));
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  });
}

export default function StudentChart() {
  const dates = last30DayLabels(values.length);

  const options: ApexOptions = {
    chart: {
      type: "area",
      sparkline: { enabled: true },
    },
    colors: ["#2563eb"],
    stroke: { width: 1.5 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0,
        stops: [0, 100],
      },
    },
    xaxis: { categories: dates },
    yaxis: { min: 0 },
    tooltip: {
      followCursor: true,
      marker: { show: false },
      y: {
        title: {
          formatter: () => "",
        },
      },
    },
  };

  const series = [{ data: values }];

  return (
    <div className="max-w-47.5">
      <Chart
        options={options}
        series={series}
        type="area"
        height="100%"
        width="100%"
      />
    </div>
  );
}
