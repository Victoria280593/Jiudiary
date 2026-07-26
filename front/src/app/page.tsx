import { redirect } from "next/navigation";
import { CoachHome } from "@/components/CoachHome";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role === "COACH") {
    return <CoachHome coachId={user.id} coachName={user.name} />;
  }

  redirect("/dashboard");
}
