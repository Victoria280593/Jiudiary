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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export type FightChartPoint = {
  label: string;
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
        autoSkip: true,
        color: "#7b6f61",
        font: { size: 11, weight: 500 },
        maxRotation: 0,
        maxTicksLimit: 8,
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
  return (
    <Line
      options={options}
      data={{
        labels: points.map((point) => point.label),
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
          pointRadius: points.length > 45 ? 0 : 3.5,
          tension: 0.32,
        }],
      }}
    />
  );
}
