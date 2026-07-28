"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { updateAthleteProfileAction, type FormState } from "@/app/actions/profile";
import { SubmitButton } from "@/components/SubmitButton";
import { BELT_LABELS, MAX_BLACK_BELT_DEGREE, MAX_STRIPES, beltsForAge, calculateAge } from "@/lib/belt";
import { errorClass, inputClass, labelClass } from "@/lib/ui";
import type { Belt } from "@prisma/client";
import type { Country } from "@/lib/countries";

type ClientInfoResponse = {
  country: string | null;
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

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function AthleteProfileForm({
  countries,
  countryCode,
  birthDate,
  belt,
  stripes,
  blackBeltDegree,
  blackBeltAwardedAt,
  blackBeltProfessor,
}: {
  countries: Country[];
  countryCode: string | null;
  birthDate: Date | null;
  belt: Belt | null;
  stripes: number | null;
  blackBeltDegree: number | null;
  blackBeltAwardedAt: Date | null;
  blackBeltProfessor: string | null;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    updateAthleteProfileAction,
    undefined
  );

  const [birthDateValue, setBirthDateValue] = useState(toDateInputValue(birthDate));
  const [selectedBelt, setSelectedBelt] = useState<Belt | "">(belt ?? "");
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCode ?? "");

  useEffect(() => {
    let cancelled = false;

    async function loadClientInfo() {
      try {
        const response = await fetch("/api/client-info", { cache: "no-store" });
        if (!response.ok) return;

        const clientInfo: ClientInfoResponse = await response.json();

        if (cancelled) return;

        const normalizedCountry = clientInfo.country?.normalize("NFC").trim().toLocaleLowerCase("ru-RU");
        const selectedCountry = countries.find(
          (country) => country.name.normalize("NFC").trim().toLocaleLowerCase("ru-RU") === normalizedCountry
        );
        setSelectedCountryCode(selectedCountry?.code ?? countryCode ?? "");
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
  }, [countries, countryCode, belt]);

  useEffect(() => {
    if (!state?.success) return;

    let cancelled = false;

    async function reloadClientInfo() {
      try {
        const response = await fetch(`/api/client-info?refresh=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;

        const clientInfo: ClientInfoResponse = await response.json();
        if (cancelled) return;

        setBirthDateValue(clientInfo.birthDate ?? "");
        setSelectedBelt(BELT_BY_ID[clientInfo.beltId ?? 0] ?? state?.belt ?? belt ?? "");
      } catch {
        if (!cancelled && state?.belt) {
          setSelectedBelt(state.belt);
        }
      }
    }

    void reloadClientInfo();
    return () => {
      cancelled = true;
    };
  }, [state, belt]);

  const availableBelts = useMemo(() => {
    if (!birthDateValue) return null; // возраст неизвестен — не ограничиваем выбор
    const parsed = new Date(birthDateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return beltsForAge(calculateAge(parsed));
  }, [birthDateValue]);

  const beltOptions = availableBelts ?? (Object.keys(BELT_LABELS) as Belt[]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && <p className={errorClass}>{state.error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="countryCode" className={labelClass}>
            Страна
          </label>
          <select
            id="countryCode"
            value="RU"
            disabled
            className={inputClass}
          >
            <option value="">Не указана</option>
            {countries.filter((c) => c.code === "RU").map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="hidden" name="countryCode" value="RU" />
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

      <div className="flex flex-col gap-1">
        <label htmlFor="belt" className={labelClass}>
          Пояс
        </label>
        <select
          id="belt"
          name="belt"
          required
          value={selectedBelt}
          onChange={(e) => setSelectedBelt(e.target.value as Belt)}
          className={inputClass}
        >
          <option value="" disabled>
            Выберите пояс
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

      {selectedBelt === "BLACK" ? (
        <div className="flex flex-col gap-4 rounded-md bg-surface-muted p-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="blackBeltDegree" className={labelClass}>
                Степень (0–{MAX_BLACK_BELT_DEGREE})
              </label>
              <input
                id="blackBeltDegree"
                name="blackBeltDegree"
                type="number"
                min={0}
                max={MAX_BLACK_BELT_DEGREE}
                defaultValue={blackBeltDegree ?? 0}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="blackBeltAwardedAt" className={labelClass}>
                Дата присвоения
              </label>
              <input
                id="blackBeltAwardedAt"
                name="blackBeltAwardedAt"
                type="date"
                defaultValue={toDateInputValue(blackBeltAwardedAt)}
                max={toDateInputValue(new Date())}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="blackBeltProfessor" className={labelClass}>
              Профессор, присвоивший пояс
            </label>
            <input
              id="blackBeltProfessor"
              name="blackBeltProfessor"
              type="text"
              defaultValue={blackBeltProfessor ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      ) : selectedBelt === "BLACK_RED" || selectedBelt === "RED" ? null : (
        <div className="flex flex-col gap-1">
          <label htmlFor="stripes" className={labelClass}>
            Страйпы (0–{MAX_STRIPES})
          </label>
          <input
            id="stripes"
            name="stripes"
            type="number"
            min={0}
            max={MAX_STRIPES}
            defaultValue={stripes ?? 0}
            required
            className={`w-32 ${inputClass}`}
          />
        </div>
      )}

      <SubmitButton>Сохранить</SubmitButton>
    </form>
  );
}
