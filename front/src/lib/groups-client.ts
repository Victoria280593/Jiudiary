export type Group = {
  id: string;
  name: string;
  colorId: number;
  colorName: string;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
};

export type GroupColor = {
  id: number;
  name: string;
};

export async function getGroups(groupId?: string): Promise<Group[]> {
  const query = new URLSearchParams({ refresh: Date.now().toString() });
  if (groupId) query.set("groupId", groupId);

  const response = await fetch(`/api/groups?${query}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Не удалось загрузить группы.");
  return (await response.json()) as Group[];
}

export async function getGroupColors(): Promise<GroupColor[]> {
  const response = await fetch("/api/groups/colors", { cache: "no-store" });
  if (!response.ok) throw new Error("Не удалось загрузить цвета групп.");
  return (await response.json()) as GroupColor[];
}
