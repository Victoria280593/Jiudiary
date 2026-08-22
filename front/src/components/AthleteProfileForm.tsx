"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BELT_ID_BY_NAME } from "@/lib/belt";
import { errorClass, inputClass, labelClass } from "@/lib/ui";
import type { Belt } from "@prisma/client";

type ClientInfoResponse = {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string | null;
  beltId: number | null;
  beltName: string | null;
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function AthleteProfileForm({
  firstName,
  lastName,
  middleName,
  birthDate,
  belt,
}: {
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: Date | null;
  belt: Belt | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<{ error?: string; success?: boolean }>();
  const [isSaving, setIsSaving] = useState(false);
  const [firstNameValue, setFirstNameValue] = useState(firstName);
  const [lastNameValue, setLastNameValue] = useState(lastName);
  const [middleNameValue, setMiddleNameValue] = useState(middleName ?? "");
  const [birthDateValue, setBirthDateValue] = useState(toDateInputValue(birthDate));
  const [beltIdValue, setBeltIdValue] = useState<number | null>(
    belt ? BELT_ID_BY_NAME[belt] : null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadClientInfo() {
      try {
        const response = await fetch("/api/client-info", { cache: "no-store" });
        if (!response.ok) return;

        const clientInfo: ClientInfoResponse = await response.json();

        if (cancelled) return;

        setFirstNameValue(clientInfo.firstName);
        setLastNameValue(clientInfo.lastName);
        setMiddleNameValue(clientInfo.middleName ?? "");
        setBirthDateValue(clientInfo.birthDate ?? "");
        setBeltIdValue(clientInfo.beltId);
      } catch {
        // Server-rendered values remain visible if the API is temporarily unavailable.
      }
    }

    void loadClientInfo();
    return () => {
      cancelled = true;
    };
  }, [belt]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setState(undefined);

    if (!firstNameValue.trim() || !lastNameValue.trim()) {
      setState({ error: "Укажите имя и фамилию" });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/client-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstNameValue.trim(),
          lastName: lastNameValue.trim(),
          middleName: middleNameValue.trim() || null,
          birthDate: birthDateValue || null,
          beltId: beltIdValue,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setState({ error: error?.error ?? "Не удалось сохранить данные" });
        return;
      }

      const savedClientInfo: ClientInfoResponse = await response.json();
      setFirstNameValue(savedClientInfo.firstName);
      setLastNameValue(savedClientInfo.lastName);
      setMiddleNameValue(savedClientInfo.middleName ?? "");
      setBirthDateValue(savedClientInfo.birthDate ?? "");
      setBeltIdValue(savedClientInfo.beltId);
      setState({ success: true });
      router.refresh();
    } catch {
      setState({ error: "Не удалось сохранить данные" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {state?.error && <p className={errorClass}>{state.error}</p>}

      <fieldset className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="lastName" className={labelClass}>
              Фамилия
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              maxLength={200}
              autoComplete="family-name"
              value={lastNameValue}
              onChange={(event) => setLastNameValue(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="firstName" className={labelClass}>
              Имя
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              maxLength={200}
              autoComplete="given-name"
              value={firstNameValue}
              onChange={(event) => setFirstNameValue(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="middleName" className={labelClass}>
              Отчество (необязательно)
            </label>
            <input
              id="middleName"
              name="middleName"
              type="text"
              maxLength={200}
              autoComplete="additional-name"
              value={middleNameValue}
              onChange={(event) => setMiddleNameValue(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="birthDate" className={labelClass}>
              Дата рождения
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              value={birthDateValue}
              onChange={(e) => setBirthDateValue(e.target.value)}
              max={toDateInputValue(new Date())}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-md bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Подождите…" : "Сохранить"}
        </button>
      </fieldset>
    </form>
  );
}
