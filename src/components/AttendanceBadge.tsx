export function AttendanceBadge({ attended }: { attended: boolean | null }) {
  if (attended === true) {
    return (
      <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
        Был
      </span>
    );
  }
  if (attended === false) {
    return (
      <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-medium text-danger">
        Не был
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
      Не отмечено
    </span>
  );
}
