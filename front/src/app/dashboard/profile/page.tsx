import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AvatarUploadForm } from "@/components/AvatarUploadForm";
import { AthleteCard } from "@/components/AthleteCard";
import { AthleteProfileForm } from "@/components/AthleteProfileForm";
import { AchievementForm } from "@/components/AchievementForm";
import { Card } from "@/components/Card";
import { PersonalDataForm } from "@/components/PersonalDataForm";
import { deleteAchievementAction } from "@/app/actions/achievement";
import { calculateAge } from "@/lib/belt";
import { flagEmoji, getCountryList, getCountryName } from "@/lib/countries";
import { formatDate } from "@/lib/format";
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

  const achievements = await prisma.achievement.findMany({ where: { userId: user.id } });
  // Достижения с указанной датой турнира — сверху, от новых к старым.
  // Без даты — в конце списка (не подменяем дату турнира датой добавления записи).
  achievements.sort((a, b) => {
    if (a.date && b.date) return b.date.getTime() - a.date.getTime();
    if (a.date) return -1;
    if (b.date) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Мой профиль</h1>
        <p className="text-sm text-muted">
          {user.name} · {ROLE_LABELS[user.role]}
        </p>
      </div>

      <AthleteCard
        name={user.name}
        avatarUrl={user.avatarUrl}
        flagEmoji={flagEmoji(user.countryCode)}
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

      <Card title="Спортивные достижения">
        <AchievementForm />

        {achievements.length > 0 && (
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {achievements.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-foreground">{a.description}</p>
                  {a.date && (
                    <p className="mt-0.5 text-xs text-muted">{formatDate(a.date)}</p>
                  )}
                </div>
                <form action={deleteAchievementAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="shrink-0 text-xs text-muted hover:text-danger"
                  >
                    Удалить
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
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
