import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const secret = process.env.EMAIL_PASSWORD_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("EMAIL_PASSWORD_ENCRYPTION_KEY não está configurada.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptEmailPassword(password) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptEmailPassword(encryptedPassword) {
  const [ivHex, authTagHex, encryptedHex] = encryptedPassword.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Password encriptada inválida.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export async function sendConfiguredEmail({ to, subject, text, html }) {
  const emailSettings = await prisma.emailSettings.findFirst({
    orderBy: { id: "asc" },
  });
  if (!emailSettings) {
    throw new Error("Configuração de email não encontrada.");
  }
  if (
    !emailSettings.reply_email ||
    !emailSettings.reply_password ||
    !emailSettings.sending_server ||
    !emailSettings.sending_port
  ) {
    throw new Error("Configuração SMTP incompleta.");
  }

  const port = Number(emailSettings.sending_port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("A porta SMTP configurada é inválida.");
  }

  const transporter = nodemailer.createTransport({
    host: emailSettings.sending_server,
    port,
    secure: port === 465,
    auth: {
      user: emailSettings.reply_email,
      pass: decryptEmailPassword(emailSettings.reply_password),
    },
  });

  await transporter.sendMail({
    from: emailSettings.reply_email,
    to,
    subject,
    text,
    html,
  });
}
