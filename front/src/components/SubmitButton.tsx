"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  disabled = false,
  pendingText = "Подождите…",
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={className ?? "w-full rounded-md bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"}
    >
      {pending ? pendingText : children}
    </button>
  );
}
