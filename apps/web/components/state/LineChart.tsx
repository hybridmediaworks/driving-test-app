"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";

export default function LineChart() {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    chart.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "none" },
        backgroundColor: "#111827",
        borderWidth: 0,
        padding: [8, 10],
        textStyle: { color: "#fff", fontSize: 12 },
        extraCssText: "border-radius:10px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);",
        formatter: (params: unknown) => {
          const value = (params as { value: number }[])[0].value;
          return `<div style="display:flex; flex-direction:column; gap:2px;"><span style="color:#9CA3AF; font-size:11px;">April 13, 2026</span><span style="font-weight:600; font-size:14px;">${value}</span></div>`;
        },
      },
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { type: "category", show: false, data: [1, 2, 3, 4, 5, 6, 7] },
      yAxis: { type: "value", show: false },
      series: [
        {
          data: [8, 9, 7, 8, 7, 8, 7],
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          emphasis: { showSymbol: true },
          lineStyle: { width: 2, color: "#22c55e" },
        },
      ],
    });

    function handleResize() {
      chart.resize();
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, []);

  return <div ref={chartRef} className="h-[30px] w-[70px]" />;
}
