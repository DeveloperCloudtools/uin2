
import { NextResponse } from "next/server";

import {
  validateCredentials,
  generateToken,
} from "@/lib/guests-checkins-auth";

import { getRequestHotelConfig } from "@/lib/hotelConfig";

import {
  checkLoginAttempts,
  registerFailedAttempt,
  resetLoginAttempts,
} from "@/lib/loginRateLimit";

export async function POST(request) {
  try {
    // Identificar IP do cliente
    const forwardedFor = request.headers.get("x-forwarded-for");

    const ip = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "unknown";

    // Verificar se o IP está bloqueado
    const rateLimit = checkLoginAttempts(ip);

    if (rateLimit.blocked) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many failed login attempts. Try again later.",
          retry_after: rateLimit.remainingTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.remainingTime),
          },
        }
      );
    }

    // Obter configuração do hotel
    const hotelConfig = await getRequestHotelConfig();

    // Ler os dados enviados
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    const { username, password } = body;

    // Validar campos obrigatórios
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Username and password are required",
        },
        { status: 400 }
      );
    }

    // Validar credenciais
    if (!validateCredentials(username, password, hotelConfig)) {

      const result = registerFailedAttempt(ip);

      return NextResponse.json(
        {
          success: false,
          message: result.blocked
            ? "Account temporarily blocked. Try again in 20 minutes."
            : "Invalid credentials",
          attempts_remaining: result.attemptsRemaining,
        },
        {
          status: result.blocked ? 429 : 401,
        }
      );
    }

    // Credenciais corretas: limpar tentativas
    resetLoginAttempts(ip);

    // Gerar Guest Token
    const token = generateToken(hotelConfig.subdomain);

    return NextResponse.json({
      success: true,
      token,
      token_type: "Bearer",
      expires_in: 120,
    });

  } catch (error) {
    console.error("GuestsCheckins token error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
