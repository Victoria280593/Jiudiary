export const RULE_TOPICS = [
  {
    title: "Формат соревнований",
    description: "Система проведения турнира, порядок выхода на ковёр и определение победителя.",
  },
  {
    title: "Весовые и возрастные категории",
    description: "Разделение участников по возрасту, весу и уровню подготовки.",
  },
  {
    title: "Баллы и преимущества",
    description: "Начисление баллов за технические действия, преимущества и критерии судейского решения.",
  },
  {
    title: "Запрещённые действия",
    description: "Ограничения на приёмы и действия в зависимости от категории участника.",
  },
  {
    title: "Длительность схваток",
    description: "Продолжительность поединков и правила дополнительного времени.",
  },
  {
    title: "Форма, экипировка и допуск",
    description: "Требования к форме участника, защитной экипировке и прохождению контроля.",
  },
] as const;

export const RULE_ORGANIZATIONS = [
  {
    slug: "bgf",
    name: "BGF",
    description: "Правила соревнований и требования регламента BGF.",
    badgeClassName: "bg-[#9b7045] text-white",
  },
  {
    slug: "idc",
    name: "IDC",
    description: "Структура правил, система оценок и ограничения IDC.",
    badgeClassName: "bg-[#557a8d] text-white",
  },
  {
    slug: "uv",
    name: "UV",
    description: "Категории участников и правила проведения турниров UV.",
    badgeClassName: "bg-[#5f7f69] text-white",
  },
  {
    slug: "gp",
    name: "GP",
    description: "Регламент схваток, начисление баллов и требования GP.",
    badgeClassName: "bg-[#77658d] text-white",
  },
] as const;

export type RuleOrganization = (typeof RULE_ORGANIZATIONS)[number];

export function getRuleOrganization(slug: string) {
  return RULE_ORGANIZATIONS.find((organization) => organization.slug === slug);
}
