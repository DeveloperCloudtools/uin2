import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateToken } from "@/lib/guests-checkins-auth";
import { getRequestHotelConfig } from "@/lib/hotelConfig";

// Converter datas para DateTime do Prisma
function parseDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Invalid date format");
  }

  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
    ? value
    : `${value}Z`;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date: " + value);
  }

  return date;
}

// Validar campos numéricos
function parseInteger(value, max = 2147483647) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isSafeInteger(number) ||
    number < 0 ||
    number > max
  ) {
    throw new Error("Invalid integer value");
  }

  return number;
}

// Criar objeto de uma pessoa
function createGuestData(reservation, guest, guestType) {
  return {
    reservation_number: reservation.reservation_number,
    room_number: reservation.room_number ?? null,

    checkin_date: parseDate(reservation.checkin_date),
    checkout_date: parseDate(reservation.checkout_date),

    reservation_adults: parseInteger(reservation.reservation_adults),
    reservation_childs: parseInteger(reservation.reservation_childs),

    reservation_status: reservation.reservation_status ?? null,

    guest_id: parseInteger(guest.guest_id, 4294967295),
    guest_type: guestType,

    guest_name: guest.guest_name ?? null,
    guest_surname: guest.guest_surname ?? null,

    birth_date: parseDate(guest.birth_date),

    gender: guest.gender ?? null,
    nationality: guest.nationality ?? null,
    country: guest.country ?? null,

    email: guest.email ?? null,
    phone_number: guest.phone_number ?? null,
  };
}

export async function POST(request) {
  console.log("");
  console.log("============================================");
  console.log("🚀 [CHECKINS] POST REQUEST RECEIVED");
  console.log("============================================");

  try {
    // 1. Obter configuração do hotel
    console.log("🏨 [CHECKINS] Getting hotel configuration...");

    const hotelConfig = await getRequestHotelConfig();

    console.log("🏨 [CHECKINS] Hotel subdomain:", hotelConfig.subdomain);

    // 2. Validar Bearer Token
    console.log("🔐 [CHECKINS] Validating authorization...");

    const authorization = request.headers.get("authorization");

    console.log(
      "🔐 [CHECKINS] Authorization header received:",
      !!authorization
    );

    if (!authorization || !authorization.startsWith("Bearer ")) {
      console.log("❌ [CHECKINS] Bearer token missing");

      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Bearer token required",
        },
        { status: 401 }
      );
    }

    const token = authorization.substring(7).trim();

    console.log("🔐 [CHECKINS] Token received:", !!token);

    if (!token || !validateToken(token, hotelConfig.subdomain)) {
      console.log("❌ [CHECKINS] Invalid or expired token");

      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Invalid or expired token",
        },
        { status: 401 }
      );
    }

    console.log("✅ [CHECKINS] Token validated successfully");

    // 3. Ler JSON
    console.log("📥 [CHECKINS] Reading request JSON...");

    let body;

    try {
      body = await request.json();

      console.log("✅ [CHECKINS] JSON received successfully");

      console.log(
        "📥 [CHECKINS] Body type:",
        Array.isArray(body) ? "Array" : typeof body
      );

      console.log(
        "📥 [CHECKINS] Reservations received:",
        Array.isArray(body) ? body.length : "Not an array"
      );

      // Mostrar dados recebidos
      console.log(
        "📥 [CHECKINS] Complete received body:",
        JSON.stringify(body, null, 2)
      );

    } catch (error) {
      console.error("❌ [CHECKINS] Invalid JSON:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    // 4. Validar estrutura principal
    console.log("🔎 [CHECKINS] Validating reservation structure...");

    if (!Array.isArray(body) || body.length === 0) {
      console.log("❌ [CHECKINS] Body is not a valid non-empty array");

      return NextResponse.json(
        {
          success: false,
          message: "The request body must be a non-empty array of reservations",
        },
        { status: 400 }
      );
    }

    for (const reservation of body) {
      console.log(
        "🔎 [CHECKINS] Validating reservation:",
        reservation?.reservation_number
      );

      if (
        !reservation ||
        typeof reservation !== "object" ||
        Array.isArray(reservation) ||
        typeof reservation.reservation_number !== "string" ||
        !reservation.reservation_number.trim() ||
        !Array.isArray(reservation.attachedprofiles)
      ) {
        console.log("❌ [CHECKINS] Invalid reservation data");

        return NextResponse.json(
          {
            success: false,
            message: "Invalid reservation data",
          },
          { status: 400 }
        );
      }

      console.log(
        "👥 [CHECKINS] Attached profiles:",
        reservation.attachedprofiles.length
      );

      for (const profile of reservation.attachedprofiles) {
        if (
          !profile ||
          typeof profile !== "object" ||
          Array.isArray(profile)
        ) {
          console.log("❌ [CHECKINS] Invalid attached profile data");

          return NextResponse.json(
            {
              success: false,
              message: "Invalid attached profile data",
            },
            { status: 400 }
          );
        }
      }
    }

    console.log("✅ [CHECKINS] Reservation structure validated");

    // 5. Preparar todos os registos antes de gravar
    console.log("⚙️ [CHECKINS] Preparing guest records...");

    const guestsToInsert = [];

    try {
      for (const reservation of body) {
        console.log(
          "⚙️ [CHECKINS] Processing reservation:",
          reservation.reservation_number
        );

        // Titular
        const titular = createGuestData(
          reservation,
          reservation,
          "titular"
        );

        guestsToInsert.push(titular);

        console.log(
          "👤 [CHECKINS] Titular prepared:",
          titular.guest_name,
          titular.guest_surname
        );

        // Acompanhantes
        for (const profile of reservation.attachedprofiles) {
          const acompanhante = createGuestData(
            reservation,
            profile,
            "acompanhante"
          );

          guestsToInsert.push(acompanhante);

          console.log(
            "👥 [CHECKINS] Acompanhante prepared:",
            acompanhante.guest_name,
            acompanhante.guest_surname
          );
        }
      }

      console.log(
        "✅ [CHECKINS] Total guest records prepared:",
        guestsToInsert.length
      );

    } catch (error) {
      console.error(
        "❌ [CHECKINS] Error preparing guest records:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    // 6. Gravar todos os registos numa transação
    console.log("💾 [CHECKINS] Starting Prisma transaction...");

    await prisma.$transaction(async (tx) => {
      for (const guest of guestsToInsert) {
        console.log(
          "💾 [CHECKINS] Saving guest:",
          guest.guest_name,
          guest.guest_surname,
          "| Reservation:",
          guest.reservation_number,
          "| Type:",
          guest.guest_type
        );

        await tx.guestsCheckinsReservations.create({
          data: guest,
        });

        console.log(
          "✅ [CHECKINS] Guest saved:",
          guest.guest_name,
          guest.guest_surname
        );
      }
    });

    console.log("✅ [CHECKINS] All guests saved successfully");

    // 7. Enviar os hóspedes com email para generateLink
    console.log("📧 [CHECKINS] Preparing email delivery...");

    let emailResult;

    try {
      const guestsWithEmail = guestsToInsert.filter(
        (guest) =>
          typeof guest.email === "string" &&
          guest.email.trim() !== ""
      );

      console.log(
        "📧 [CHECKINS] Guests with email:",
        guestsWithEmail.length
      );

      console.log(
        "📧 [CHECKINS] Guests without email:",
        guestsToInsert.length - guestsWithEmail.length
      );

      if (guestsWithEmail.length > 0) {
        const projectUrl = (
          hotelConfig.PROJECT_URL ||
          hotelConfig.NEXTAUTH_URL
        )?.replace(/\/+$/, "");

        if (!projectUrl) {
          throw new Error(
            "PROJECT_URL ou NEXTAUTH_URL não está configurada."
          );
        }

        const generateLinkUrl = new URL(
          "/api/guestsCheckins/generateLink",
          projectUrl
        );

        console.log(
          "📧 [CHECKINS] Calling generateLink:",
          generateLinkUrl.toString()
        );

        console.log(
          "📧 [CHECKINS] Emails being processed:",
          guestsWithEmail.map((guest) => ({
            reservation_number: guest.reservation_number,
            guest_name: guest.guest_name,
            has_email: !!guest.email,
          }))
        );

        const response = await fetch(generateLinkUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret":
              process.env.GUESTS_CHECKINS_SECRET,
          },
          body: JSON.stringify({
            guests: guestsWithEmail,
          }),
          cache: "no-store",
        });

        console.log(
          "📧 [CHECKINS] generateLink HTTP status:",
          response.status
        );

        console.log(
          "📧 [CHECKINS] generateLink response OK:",
          response.ok
        );

        emailResult = await response.json();

        console.log(
          "📧 [CHECKINS] generateLink response body:",
          emailResult
        );

        if (!response.ok) {
          console.error(
            "❌ [CHECKINS] GenerateLink API error:",
            emailResult
          );
        } else {
          console.log(
            "✅ [CHECKINS] generateLink executed successfully"
          );
        }

      } else {
        console.log(
          "⚠️ [CHECKINS] No guests with email addresses"
        );

        emailResult = {
          success: true,
          sent_count: 0,
          message: "No guests with email addresses",
        };
      }

    } catch (error) {
      console.error(
        "❌ [CHECKINS] GenerateLink request error:",
        error
      );

      emailResult = {
        success: false,
        message: "Could not process guest emails",
      };
    }

    // 8. Resposta final
    console.log("");
    console.log("============================================");
    console.log("✅ [CHECKINS] PROCESS COMPLETED");
    console.log("Reservations:", body.length);
    console.log("Guests:", guestsToInsert.length);
    console.log("Email result:", emailResult);
    console.log("============================================");

    return NextResponse.json(
      {
        success: true,
        message: "Reservations received and saved successfully",
        reservations_count: body.length,
        guests_count: guestsToInsert.length,
        email_delivery: emailResult,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("");
    console.error("============================================");
    console.error("❌ [CHECKINS] FATAL ERROR");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("============================================");

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
