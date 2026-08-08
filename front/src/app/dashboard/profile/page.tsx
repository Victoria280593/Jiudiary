import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AthleteProfileForm } from "@/components/AthleteProfileForm";
import { Card } from "@/components/Card";
import { PersonalDataForm } from "@/components/PersonalDataForm";
import { ProfileHero } from "@/components/ProfileHero";
import { CoachGroupsCard } from "@/components/CoachGroupsCard";
import { calculateAge } from "@/lib/belt";
import type { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Админ",
  COACH: "Тренер",
  STUDENT: "Ученик",
  PARENT: "Родитель",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
          Мой профиль
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Просматривайте свои данные и настройки
        </p>
      </div>

      <ProfileHero
        name={user.name}
        roleLabel={ROLE_LABELS[user.role]}
        avatarUrl={user.avatarUrl}
        age={user.birthDate ? calculateAge(user.birthDate) : null}
        belt={user.belt}
      />

      {user.role === "COACH" && <CoachGroupsCard />}

      <Card title="Спортивные данные">
        <AthleteProfileForm
          key={user.updatedAt.getTime()}
          birthDate={user.birthDate}
          belt={user.belt}
        />
      </Card>

      <Card title="Личные данные">
        <PersonalDataForm name={user.name} email={user.email} />
      </Card>
    </div>
  );
}
