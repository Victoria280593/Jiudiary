"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export type FightChartPoint = {
  label: string;
  compactLabel: string;
  fightsCount: number;
};

const options: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  normalized: true,
  interaction: {
    intersect: false,
    mode: "index",
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      backgroundColor: "#2b241d",
      bodyFont: { size: 13, weight: 600 },
      callbacks: {
        label: (context) => `Схватки: ${context.parsed.y}`,
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
        font: { size: 11, weight: 500 },
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

export default function FightTrendChart({ points }: { points: FightChartPoint[] }) {
  const [useCompactLabels, setUseCompactLabels] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateLabelMode = () => setUseCompactLabels(mediaQuery.matches);
    updateLabelMode();
    mediaQuery.addEventListener("change", updateLabelMode);
    return () => mediaQuery.removeEventListener("change", updateLabelMode);
  }, []);

  const minimumWidth = Math.max(560, points.length * (useCompactLabels ? 68 : 108));

  return (
    <div className="h-full" style={{ minWidth: minimumWidth }}>
      <Line
        options={options}
        data={{
          labels: points.map((point) => useCompactLabels ? point.compactLabel : point.label),
          datasets: [{
            data: points.map((point) => point.fightsCount),
            borderColor: "#9b7045",
            backgroundColor: "rgba(155, 112, 69, 0.12)",
            borderWidth: 2.25,
            fill: true,
            pointBackgroundColor: "#9b7045",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverRadius: 5,
            pointRadius: points.length > 45 ? 2.5 : 3.5,
            tension: 0.32,
          }],
        }}
      />
    </div>
  );
}
