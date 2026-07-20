import "server-only";
import countries from "i18n-iso-countries";
import ru from "i18n-iso-countries/langs/ru.json";

countries.registerLocale(ru);

export type Country = { code: string; name: string };

export function getCountryList(): Country[] {
  const names = countries.getNames("ru", { select: "official" });
  return Object.entries(names)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export function getCountryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return countries.getName(code, "ru") ?? null;
}

export function flagEmoji(code: string | null | undefined): string | null {
  if (!code || code.length !== 2) return null;
  const codePoints = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
