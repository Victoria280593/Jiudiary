import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AvatarUploadForm } from "@/components/AvatarUploadForm";
import { AthleteCard } from "@/components/AthleteCard";
import { AthleteProfileForm } from "@/components/AthleteProfileForm";
import { Card } from "@/components/Card";
import { PersonalDataForm } from "@/components/PersonalDataForm";
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">
          Мой профиль
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          {user.name} · {ROLE_LABELS[user.role]}
        </p>
      </div>

      <AthleteCard
        name={user.name}
        avatarUrl={user.avatarUrl}
        flagEmoji={null}
        countryName={getCountryName(user.countryCode)}
        age={user.birthDate ? calculateAge(user.birthDate) : null}
        belt={user.belt}
        stripes={user.stripes}
        blackBeltDegree={user.blackBeltDegree}
      />

      <Card title="Аватар">
        <AvatarUploadForm name={user.name} avatarUrl={user.avatarUrl} />
      </Card>

      <Card title="Спортивные данные">
        <AthleteProfileForm
          key={user.updatedAt.getTime()}
          countries={getCountryList()}
          countryCode={user.countryCode}
          birthDate={user.birthDate}
          belt={user.belt}
          stripes={user.stripes}
          blackBeltDegree={user.blackBeltDegree}
          blackBeltAwardedAt={user.blackBeltAwardedAt}
          blackBeltProfessor={user.blackBeltProfessor}
        />
      </Card>

      <Card title="Личные данные">
        <PersonalDataForm name={user.name} />
      </Card>

      <Card title="Данные аккаунта">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Имя</dt>
            <dd className="text-foreground">{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="text-foreground">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Роль</dt>
            <dd className="text-foreground">{ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
