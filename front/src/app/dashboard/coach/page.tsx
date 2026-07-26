import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function CoachDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "COACH") redirect("/dashboard");
  redirect("/");
}
