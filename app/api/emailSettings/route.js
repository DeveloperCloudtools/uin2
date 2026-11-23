
import { prisma } from "@/lib/prisma";
import { encryptEmailPassword } from "@/lib/email";

export async function GET() {
  try {
    const settings = await prisma.emailSettings.findFirst({
      orderBy: { id: "asc" },
    });

    if (!settings) {
      return Response.json(null);
    }

    // Nunca enviar a password/hash/encriptação para o frontend
    return Response.json({
      id: settings.id,
      reply_email: settings.reply_email,
      sending_server: settings.sending_server,
      sending_port: settings.sending_port,
      has_password: Boolean(settings.reply_password),
    });
  } catch (error) {
    console.error("Erro ao obter configurações:", error);

    return Response.json(
      { error: "Não foi possível obter as configurações." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const replyEmail = String(body.reply_email || "").trim();
    const replyPassword = String(body.reply_password || "");
    const sendingServer = String(body.sending_server || "").trim();
    const sendingPort = Number(body.sending_port);

    if (
      !replyEmail ||
      !sendingServer ||
      !Number.isInteger(sendingPort) ||
      sendingPort < 1 ||
      sendingPort > 65535
    ) {
      return Response.json(
        {
          error:
            "Preencha corretamente todos os campos de configuração de email.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.emailSettings.findFirst({
      orderBy: { id: "asc" },
    });

    /*
     * Só alteramos a password se o utilizador
     * tiver introduzido uma nova password.
     */
    let passwordToSave = existing?.reply_password || null;

    if (replyPassword.trim() !== "") {
      passwordToSave = encryptEmailPassword(replyPassword);
    }

    const data = {
      reply_email: replyEmail,
      sending_server: sendingServer,
      sending_port: sendingPort,
      reply_password: passwordToSave,
    };

    const settings = existing
      ? await prisma.emailSettings.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.emailSettings.create({
          data,
        });

    /*
     * Nunca devolver reply_password.
     */
    return Response.json({
      id: settings.id,
      reply_email: settings.reply_email,
      sending_server: settings.sending_server,
      sending_port: settings.sending_port,
      has_password: Boolean(settings.reply_password),
    });
  } catch (error) {
    console.error("Erro ao guardar configurações:", error);

    return Response.json(
      {
        error:
          error.message ||
          "Não foi possível guardar as configurações.",
      },
      { status: 500 }
    );
  }
}
