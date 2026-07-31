export type Branch = {
  id: string;
  name: string;
};

export async function getBranches(): Promise<Branch[]> {
  const response = await fetch(`/api/branches?refresh=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Не удалось загрузить филиалы.");
  return (await response.json()) as Branch[];
}
