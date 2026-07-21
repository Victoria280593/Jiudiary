import "server-only";
import nodemailer from "nodemailer";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP не настроен: заполните SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS в .env"
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transport.sendMail({
    from,
    to,
    subject: "Восстановление пароля — Дневник спортсмена",
    text: `Вы запросили восстановление пароля.\n\nПерейдите по ссылке, чтобы задать новый пароль (действует 1 час):\n${resetUrl}\n\nЕсли вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.`,
    html: `
      <p>Вы запросили восстановление пароля в «Дневнике спортсмена».</p>
      <p><a href="${resetUrl}">Задать новый пароль</a> (ссылка действует 1 час)</p>
      <p>Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.</p>
    `,
  });
}
