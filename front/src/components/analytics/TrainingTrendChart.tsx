"use client";

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, type ChartOptions } from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import type { FightChartPoint } from "./FightTrendChart";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const options: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  normalized: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      backgroundColor: "#2b241d",
      bodyFont: { size: 13, weight: 600 },
      callbacks: {
        label: (context) => `Тренировки: ${context.parsed.y}`,
      },
      cornerRadius: 10,
      padding: 12,
    },
  },
  scales: {
    x: {
      border: { display: false },
      grid: { display: false },
      ticks: {
        autoSkip: false,
        color: "#7b6f61",
        font: { size: 10, weight: 500 },
        maxRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: "rgba(155, 112, 69, 0.10)" },
      ticks: {
        color: "#7b6f61",
        precision: 0,
        stepSize: 1,
      },
    },
  },
};

export default function TrainingTrendChart({ points }: { points: FightChartPoint[] }) {
  const [useCompactLabels, setUseCompactLabels] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateLabelMode = () => setUseCompactLabels(mediaQuery.matches);
    updateLabelMode();
    mediaQuery.addEventListener("change", updateLabelMode);
    return () => mediaQuery.removeEventListener("change", updateLabelMode);
  }, []);

  const minimumWidth = Math.max(520, points.length * (useCompactLabels ? 62 : 96));

  return (
    <div className="h-full" style={{ minWidth: minimumWidth }}>
      <Bar
        options={options}
        data={{
          labels: points.map((point) => useCompactLabels ? point.compactLabel : point.label),
          datasets: [{
            data: points.map((point) => point.trainingsCount),
            backgroundColor: "rgba(155, 112, 69, 0.72)",
            borderColor: "#9b7045",
            borderWidth: 1,
            borderRadius: 7,
            borderSkipped: false,
            maxBarThickness: 38,
          }],
        }}
      />
    </div>
  );
}
