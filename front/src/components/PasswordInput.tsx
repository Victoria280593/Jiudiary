"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import { inputClass } from "@/lib/ui";

type PasswordInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={isPasswordVisible ? "text" : "password"}
        className={`${inputClass} w-full pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
        aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
        aria-pressed={isPasswordVisible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPasswordVisible ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.8 10.8 0 0112 4c5.5 0 9 5.2 9 5.2a15 15 0 01-2.3 3M6.2 6.2C4.1 7.5 3 9.2 3 9.2S6.5 16 12 16a9.8 9.8 0 003.1-.5" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
