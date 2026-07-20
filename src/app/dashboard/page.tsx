import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardIndex() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  switch (user.role) {
    case "ADMIN":
      redirect("/dashboard/admin");
    case "COACH":
      redirect("/dashboard/coach");
    case "STUDENT":
      redirect("/dashboard/student");
    case "PARENT":
      redirect("/dashboard/parent");
  }
}
