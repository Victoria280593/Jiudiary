"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BELT_LABELS, beltsForAge, calculateAge } from "@/lib/belt";
import { notifyBeltUpdated } from "@/components/LiveBelt";
import { errorClass, inputClass, labelClass } from "@/lib/ui";
import type { Belt } from "@prisma/client";

type ClientInfoResponse = {
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string | null;
  beltId: number | null;
  beltName: string | null;
};

const BELT_BY_ID: Record<number, Belt> = {
  1: "WHITE",
  2: "GREY_WHITE",
  3: "GREY",
  4: "GREY_BLACK",
  5: "YELLOW_WHITE",
  6: "YELLOW",
  7: "YELLOW_BLACK",
  8: "ORANGE_WHITE",
  9: "ORANGE",
  10: "ORANGE_BLACK",
  11: "GREEN_WHITE",
  12: "GREEN",
  13: "GREEN_BLACK",
  14: "BLUE",
  15: "PURPLE",
  16: "BROWN",
  17: "BLACK",
  18: "BLACK_RED",
  19: "RED",
};

const BELT_ID_BY_NAME = Object.fromEntries(
  Object.entries(BELT_BY_ID).map(([id, name]) => [name, Number(id)])
) as Record<Belt, number>;

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
  const [selectedBelt, setSelectedBelt] = useState<Belt | "">(belt ?? "");

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
        setSelectedBelt(BELT_BY_ID[clientInfo.beltId ?? 0] ?? belt ?? "");
      } catch {
        // Server-rendered values remain visible if the API is temporarily unavailable.
      }
    }

    void loadClientInfo();
    return () => {
      cancelled = true;
    };
  }, [belt]);

  const availableBelts = useMemo(() => {
    if (!birthDateValue) return null; // возраст неизвестен — не ограничиваем выбор
    const parsed = new Date(birthDateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return beltsForAge(calculateAge(parsed));
  }, [birthDateValue]);

  const beltOptions = availableBelts ?? (Object.keys(BELT_LABELS) as Belt[]);

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
          beltId: selectedBelt ? BELT_ID_BY_NAME[selectedBelt] : null,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setState({ error: error?.error ?? "Не удалось сохранить данные" });
        return;
      }

      const savedClientInfo: ClientInfoResponse = await response.json();
      const savedBelt = BELT_BY_ID[savedClientInfo.beltId ?? 0] ?? null;
      setFirstNameValue(savedClientInfo.firstName);
      setLastNameValue(savedClientInfo.lastName);
      setMiddleNameValue(savedClientInfo.middleName ?? "");
      setBirthDateValue(savedClientInfo.birthDate ?? "");
      setSelectedBelt(savedBelt ?? "");
      notifyBeltUpdated(savedBelt);
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

          <div className="flex flex-col gap-1 sm:col-span-2">
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
        </div>

        <div className="grid grid-cols-1 gap-4">
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

        <div className="flex flex-col gap-1">
          <label htmlFor="belt" className={labelClass}>
            Пояс
          </label>
          <select
            id="belt"
            name="belt"
            value={selectedBelt}
            onChange={(e) => setSelectedBelt(e.target.value as Belt | "")}
            className={inputClass}
          >
            <option value="">
              Без пояса
            </option>
            {beltOptions.map((b) => (
              <option key={b} value={b}>
                {BELT_LABELS[b]}
              </option>
            ))}
          </select>
          {!birthDateValue && (
            <p className="text-xs text-muted">
              Укажите дату рождения, чтобы видеть только пояса, доступные для этого возраста
              (детская или взрослая система IBJJF).
            </p>
          )}
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
