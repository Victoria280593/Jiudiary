import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    console.log(`Администратор уже существует: ${existingAdmin.email}`);
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Администратор";

  if (!email || !password) {
    console.log(
      "Пропускаю создание администратора: заполните ADMIN_EMAIL и ADMIN_PASSWORD в .env, затем запустите `npm run db:seed` ещё раз."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "ADMIN" },
    create: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Администратор создан: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
