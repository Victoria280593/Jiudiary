import { Avatar } from "@/components/Avatar";
import { Belt } from "@/components/Belt";
import { Card } from "@/components/Card";
import { BELT_LABELS } from "@/lib/belt";
import type { Belt as BeltType } from "@prisma/client";

export function AthleteCard({
  name,
  avatarUrl,
  flagEmoji,
  countryName,
  age,
  belt,
  stripes,
  blackBeltDegree,
}: {
  name: string;
  avatarUrl: string | null;
  flagEmoji: string | null;
  countryName: string | null;
  age: number | null;
  belt: BeltType | null;
  stripes: number | null;
  blackBeltDegree: number | null;
}) {
  const beltStripeCount = belt === "BLACK" ? blackBeltDegree ?? 0 : stripes ?? 0;

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <div className="rounded-full bg-gradient-to-br from-accent-soft to-accent/30 p-1">
        <Avatar src={avatarUrl} name={name} size={96} />
      </div>

      <div>
        <h2 className="flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
          {flagEmoji && <span className="text-xl">{flagEmoji}</span>}
          {name}
        </h2>
        <p className="text-sm text-muted">
          {countryName && <>Гражданство: {countryName}</>}
          {countryName && age !== null && " · "}
          {age !== null && <>Возраст: {age} {pluralYears(age)}</>}
          {!countryName && age === null && "Данные не указаны"}
        </p>
      </div>

      {belt && (
        <div className="flex flex-col items-center gap-1">
          <Belt belt={belt} stripes={beltStripeCount} size="lg" />
          <p className="text-sm font-medium text-foreground/80">
            {BELT_LABELS[belt]} пояс по джиу-джитсу
            {belt === "BLACK" && blackBeltDegree
              ? ` · ${blackBeltDegree}-я степень`
              : ""}
            {belt !== "BLACK" && stripes ? ` · ${stripes} ${pluralStripes(stripes)}` : ""}
          </p>
        </div>
      )}
    </Card>
  );
}

function pluralYears(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "года";
  return "лет";
}

function pluralStripes(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "страйп";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "страйпа";
  return "страйпов";
}
