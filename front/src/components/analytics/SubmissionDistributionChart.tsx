"use client";

import { ArcElement, Chart as ChartJS, Tooltip, type ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { SubmissionAnalyticsPoint } from "@/lib/analytics-client";

ChartJS.register(ArcElement, Tooltip);

const topColors = ["#9b7045", "#c69563", "#6f8d72", "#b47d55", "#647f91", "#85708f", "#89915f", "#d07f45", "#a85f72", "#4f8a86"];
const otherColor = "#aaa39b";

const options: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "68%",
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      backgroundColor: "#2b241d",
      bodyFont: { size: 13, weight: 600 },
      callbacks: {
        label: (context) => `Количество: ${context.parsed}`,
      },
      cornerRadius: 10,
      padding: 12,
    },
  },
};

export default function SubmissionDistributionChart({ points }: { points: SubmissionAnalyticsPoint[] }) {
  const total = points.reduce((sum, point) => sum + point.count, 0);

  if (points.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-2xl bg-surface-muted/55 px-5 text-center text-sm text-muted">
        За выбранный период сабмишенов пока нет.
      </div>
    );
  }

  const sortedPoints = [...points].sort((left, right) => right.count - left.count || left.submissionId - right.submissionId);
  const otherCount = sortedPoints.slice(10).reduce((sum, point) => sum + point.count, 0);
  const displayedPoints = [
    ...sortedPoints.slice(0, 10).map((point, index) => ({ ...point, color: topColors[index] })),
    ...(otherCount > 0 ? [{ submissionId: -1, nameRu: "Другие", nameEn: "Other", count: otherCount, color: otherColor }] : []),
  ];

  return (
    <div className="grid items-center gap-7 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
      <div className="relative mx-auto h-64 w-full max-w-72">
        <Doughnut
          options={options}
          data={{
            labels: displayedPoints.map((point) => point.nameRu),
            datasets: [{
              data: displayedPoints.map((point) => point.count),
              backgroundColor: displayedPoints.map((point) => point.color),
              borderColor: "#ffffff",
              borderWidth: 3,
              hoverBorderWidth: 3,
              hoverOffset: 5,
            }],
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-[-0.04em] text-foreground">{total}</span>
          <span className="mt-1 text-xs text-muted">всего</span>
        </div>
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {displayedPoints.map((point) => (
          <div key={point.submissionId} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2.5">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: point.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{point.nameRu}</span>
              <span className="block truncate text-xs text-muted">{point.nameEn}</span>
            </span>
            <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">{point.count}</span>
            <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted">{Math.round(point.count / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
