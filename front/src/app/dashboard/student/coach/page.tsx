import { redirect } from "next/navigation";
import { AthleteCard } from "@/components/AthleteCard";
import { Card } from "@/components/Card";
import { calculateAge } from "@/lib/belt";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentCoachPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/dashboard");

  const coach = user.coachId
    ? await prisma.user.findUnique({ where: { id: user.coachId } })
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
          Мой тренер
        </h1>
        <p className="mt-1.5 text-sm text-muted">Информация о назначенном тренере</p>
      </div>

      {coach ? (
        <AthleteCard
          name={coach.name}
          avatarUrl={coach.avatarUrl}
          age={coach.birthDate ? calculateAge(coach.birthDate) : null}
          belt={coach.belt}
          blackBeltDegree={coach.blackBeltDegree}
          showBeltBadge
        />
      ) : (
        <Card>
          <p className="text-sm text-muted">
            Тренер пока не назначен. Попросите тренера добавить вас или обратитесь к администратору.
          </p>
        </Card>
      )}
    </div>
  );
}
