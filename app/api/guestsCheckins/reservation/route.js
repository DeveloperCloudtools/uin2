
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

  // Os valores sem timezone são interpretados como UTC
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
  try {
    // 1. Obter configuração do hotel
    const hotelConfig = await getRequestHotelConfig();

    // 2. Validar Bearer Token
    const authorization = request.headers.get("authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Bearer token required",
        },
        { status: 401 }
      );
    }

    const token = authorization.substring(7).trim();

    if (!token || !validateToken(token, hotelConfig.subdomain)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Invalid or expired token",
        },
        { status: 401 }
      );
    }

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

    // 4. Validar estrutura principal
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "The request body must be a non-empty array of reservations",
        },
        { status: 400 }
      );
    }

    for (const reservation of body) {
      if (
        !reservation ||
        typeof reservation !== "object" ||
        Array.isArray(reservation) ||
        typeof reservation.reservation_number !== "string" ||
        !reservation.reservation_number.trim() ||
        !Array.isArray(reservation.attachedprofiles)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid reservation data",
          },
          { status: 400 }
        );
      }

      for (const profile of reservation.attachedprofiles) {
        if (
          !profile ||
          typeof profile !== "object" ||
          Array.isArray(profile)
        ) {
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

    // 5. Preparar todos os registos antes de gravar
    const guestsToInsert = [];

    try {
      for (const reservation of body) {
        // Titular
        guestsToInsert.push(
          createGuestData(
            reservation,
            reservation,
            "titular"
          )
        );

        // Acompanhantes
        for (const profile of reservation.attachedprofiles) {
          guestsToInsert.push(
            createGuestData(
              reservation,
              profile,
              "acompanhante"
            )
          );
        }
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    // 6. Gravar todos os registos numa transação
    await prisma.$transaction(async (tx) => {
      for (const guest of guestsToInsert) {
        await tx.guestsCheckinsReservations.create({
          data: guest,
        });
      }
    });

    // 7. Resposta
    return NextResponse.json(
      {
        success: true,
        message: "Reservations received and saved successfully",
        reservations_count: body.length,
        guests_count: guestsToInsert.length,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GuestsCheckins reservation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
