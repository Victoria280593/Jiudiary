export type Group = {
  id: string;
  name: string;
};

export async function getGroups(): Promise<Group[]> {
  const response = await fetch(`/api/groups?refresh=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Не удалось загрузить группы.");
  return (await response.json()) as Group[];
}
