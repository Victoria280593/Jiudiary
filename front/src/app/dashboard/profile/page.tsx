import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AthleteProfileForm } from "@/components/AthleteProfileForm";
import { Card } from "@/components/Card";
import { PersonalDataForm } from "@/components/PersonalDataForm";
import { ProfileHero } from "@/components/ProfileHero";
import { calculateAge } from "@/lib/belt";
import { getCountryList, getCountryName } from "@/lib/countries";
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
          Управляйте своими данными и настройками
        </p>
      </div>

      <ProfileHero
        name={user.name}
        roleLabel={ROLE_LABELS[user.role]}
        avatarUrl={user.avatarUrl}
        countryName={getCountryName(user.countryCode)}
        age={user.birthDate ? calculateAge(user.birthDate) : null}
        belt={user.belt}
      />

      <Card title="Спортивные данные">
        <AthleteProfileForm
          key={user.updatedAt.getTime()}
          countries={getCountryList()}
          countryCode={user.countryCode}
          birthDate={user.birthDate}
          belt={user.belt}
          blackBeltDegree={user.blackBeltDegree}
          blackBeltAwardedAt={user.blackBeltAwardedAt}
          blackBeltProfessor={user.blackBeltProfessor}
        />
      </Card>

      <Card title="Личные данные">
        <PersonalDataForm name={user.name} email={user.email} />
      </Card>
    </div>
  );
}
