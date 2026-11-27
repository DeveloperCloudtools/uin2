
import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";
import { getRequestHotelConfig } from "@/lib/hotelConfig";
import { decryptEmailPassword } from "@/lib/email";

// Gerar código de 6 dígitos
function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Gerar código único
async function generateUniqueCode() {
  while (true) {
    const code = generateCode();

    const existing = await prisma.users_FO.findUnique({
      where: {
        access_code: code,
      },
    });

    if (!existing) {
      return code;
    }
  }
}

// Normalizar email
function normalizeEmail(email) {
  if (typeof email !== "string") {
    return null;
  }

  const normalized = email.trim().toLowerCase();

  if (
    !normalized ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

// Escapar HTML
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

// Criar ou atualizar utilizador
async function createOrUpdateGuestUser(email) {
  let user = await prisma.users_FO.findUnique({
    where: {
      email,
    },
  });

  const now = new Date();
  const code = await generateUniqueCode();
  const expiration = new Date(
    now.getTime() + 10 * 60 * 1000
  );

  // Utilizador já existente
  if (user) {
    let accountExpired = false;

    if (
      user.created_at &&
      user.account_duration !== null &&
      user.account_duration !== undefined
    ) {
      const accountExpiration = new Date(
        user.created_at.getTime() +
          Number(user.account_duration) * 1000
      );

      accountExpired = now >= accountExpiration;
    }

    user = await prisma.users_FO.update({
      where: {
        id: user.id,
      },
      data: {
        access_code: code,
        access_code_expiration: expiration,
        updated_at: now,

        ...(accountExpired
          ? {
              created_at: now,
              password: null,
              session_token: null,
              session_expires_at: null,
            }
          : {}),
      },
    });

    return user;
  }

  // Novo utilizador
  const nonGuestType = await prisma.usersFOType.findFirst({
    where: {
      userName: "Guest",
    },
    select: {
      userBOTypeID: true,
    },
  });

  if (!nonGuestType) {
    throw new Error('User type "Guest" was not found.');
  }

  user = await prisma.users_FO.create({
    data: {
      email,
      access_code: code,
      access_code_expiration: expiration,
      user_type_id: nonGuestType.userBOTypeID,
    },
  });

  return user;
}

// POST
export async function POST(request) {
  try {
    // 1. Validar chave interna
    const internalSecret = process.env.GUESTS_CHECKINS_SECRET;
    const receivedSecret = request.headers.get("x-internal-secret");

    if (
      !internalSecret ||
      !receivedSecret ||
      receivedSecret.length !== internalSecret.length ||
      !crypto.timingSafeEqual(
        Buffer.from(receivedSecret),
        Buffer.from(internalSecret)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // 2. Obter configuração do hotel
    const hotelConfig = await getRequestHotelConfig();

    // 3. Ler JSON
    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    if (!body || !Array.isArray(body.guests)) {
      return NextResponse.json(
        {
          success: false,
          message: "The guests property must be an array",
        },
        { status: 400 }
      );
    }

    // 4. Preparar URL do hotel
    const projectUrl = (
      hotelConfig.PROJECT_URL ||
      hotelConfig.NEXTAUTH_URL
    )?.replace(/\/+$/, "");

    if (!projectUrl) {
      throw new Error(
        "PROJECT_URL não está configurada para este hotel."
      );
    }

    // 5. Configurações de email
    const emailSettings = await prisma.emailSettings.findFirst({
      orderBy: {
        id: "asc",
      },
    });

    if (
      !emailSettings ||
      !emailSettings.reply_email ||
      !emailSettings.reply_password ||
      !emailSettings.sending_server ||
      !emailSettings.sending_port
    ) {
      throw new Error(
        "As configurações de email estão incompletas."
      );
    }

    const decryptedPassword = decryptEmailPassword(
      emailSettings.reply_password
    );

    const transporter = nodemailer.createTransport({
      host: emailSettings.sending_server,
      port: Number(emailSettings.sending_port),
      secure: Number(emailSettings.sending_port) === 465,
      auth: {
        user: emailSettings.reply_email,
        pass: decryptedPassword,
      },
    });

    // 6. Eliminar emails inválidos e duplicados
    const uniqueGuests = new Map();

    for (const guest of body.guests) {
      if (
        !guest ||
        typeof guest !== "object" ||
        Array.isArray(guest)
      ) {
        continue;
      }

      const email = normalizeEmail(guest.email);

      if (!email) {
        continue;
      }

      if (!uniqueGuests.has(email)) {
        uniqueGuests.set(email, guest);
      }
    }

    // 7. Processar cada hóspede
    const results = {
      success: true,
      sent_count: 0,
      failed_count: 0,
      skipped_count: body.guests.length - uniqueGuests.size,
      failures: [],
    };

    const signInUrl =
      `${projectUrl}/homepage?opensigninmodalaccesscode`;

    for (const [email, guest] of uniqueGuests) {
      try {
        // Criar ou atualizar utilizador
        const user = await createOrUpdateGuestUser(email);

        const guestName = [
          guest.guest_name,
          guest.guest_surname,
        ]
          .filter(Boolean)
          .join(" ");

        const safeGuestName = escapeHtml(
          guestName || "Guest"
        );

        const safeCode = escapeHtml(user.access_code);
        const safeSignInUrl = escapeHtml(signInUrl);

        // Enviar email
        await transporter.sendMail({
          from: emailSettings.reply_email,
          to: email,
          subject: "Access Code",

          text: `
Hello ${guestName || "Guest"},

Your access code is:

${user.access_code}

This code is valid for 10 minutes.

Sign in here:
${signInUrl}
          `,

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: auto;
              padding: 30px;
            ">
              <h2>Welcome ${safeGuestName}</h2>

              <p>Your access code is:</p>

              <div style="
                font-size: 36px;
                font-weight: bold;
                letter-spacing: 8px;
                text-align: center;
                padding: 20px;
                margin: 25px 0;
                background: #f3f4f6;
                border-radius: 12px;
              ">
                ${safeCode}
              </div>

              <p>This code is valid for 10 minutes.</p>

              <p>
                <a
                  href="${safeSignInUrl}"
                  style="
                    display: inline-block;
                    padding: 12px 20px;
                    background: #000;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 8px;
                  "
                >
                  Sign in
                </a>
              </p>
            </div>
          `,
        });

        results.sent_count++;
      } catch (error) {
        console.error(
          `Guest email error (${email}):`,
          error
        );

        results.failed_count++;

        results.failures.push({
          email,
          message: error.message || "Email could not be sent",
        });
      }
    }

    results.success = results.failed_count === 0;

    // 8. Resposta
    return NextResponse.json(
      {
        success: results.success,
        message: "Guest access links processed",
        ...results,
      },
      {
        status: results.success ? 200 : 207,
      }
    );

  } catch (error) {
    console.error(
      "GuestsCheckins generateLink error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Could not generate guest access links",
      },
      { status: 500 }
    );
  }
}
