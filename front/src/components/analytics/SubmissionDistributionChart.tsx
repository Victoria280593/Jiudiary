"use client";

import { ArcElement, Chart as ChartJS, Tooltip, type ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { SubmissionAnalyticsPoint } from "@/lib/analytics-client";

ChartJS.register(ArcElement, Tooltip);

const colors = ["#9b7045", "#c69563", "#6f8d72", "#b47d55", "#7f756a", "#d2ad7f", "#526f60", "#a45f4d"];

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

  return (
    <div className="grid items-center gap-7 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
      <div className="relative mx-auto h-64 w-full max-w-72">
        <Doughnut
          options={options}
          data={{
            labels: points.map((point) => point.nameRu),
            datasets: [{
              data: points.map((point) => point.count),
              backgroundColor: points.map((_, index) => colors[index % colors.length]),
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
        {points.map((point, index) => (
          <div key={point.submissionId} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2.5">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{point.nameRu}</span>
              <span className="block truncate text-xs text-muted">{point.nameEn}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold tabular-nums text-foreground">{point.count}</span>
              <span className="block text-[0.7rem] tabular-nums text-muted">{Math.round(point.count / total * 100)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
