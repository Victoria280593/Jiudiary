export const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const MONTH_LABELS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export type CalendarCell = { date: Date; inMonth: boolean; isToday: boolean };

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthGrid(year: number, month: number): CalendarCell[][] {
  // JavaScript считает воскресенье нулевым днём; переводим индекс к неделе с понедельника.
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + totalDaysInMonth) / 7) * 7;
  const todayKey = dateKey(new Date());

  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month - 1, i - firstWeekday + 1);
    cells.push({
      date,
      inMonth: date.getMonth() === month - 1,
      isToday: dateKey(date) === todayKey,
    });
  }

  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function addMonths(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
