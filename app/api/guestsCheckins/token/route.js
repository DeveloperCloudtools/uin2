
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

    // Ler os dados enviados
    const body = await request.json();

    // Registar pedido recebido (sem expor passwords)
    console.log("[GuestsCheckins] Pedido recebido:", {
      ip,
      username: body?.username,
      timestamp: new Date().toISOString(),
    });

    // Função para registar e devolver respostas
    const respond = (data, status = 200, options = {}) => {
      console.log("[GuestsCheckins] Resposta enviada:", {
        status,
        body: data,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(data, {
        status,
        ...options,
      });
    };

    // Verificar se o IP está bloqueado
    const rateLimit = checkLoginAttempts(ip);

    if (rateLimit.blocked) {
      return respond(
        {
          success: false,
          message: "Too many failed login attempts. Try again later.",
          retry_after: rateLimit.remainingTime,
        },
        429,
        {
          headers: {
            "Retry-After": String(rateLimit.remainingTime),
          },
        }
      );
    }

    // Obter configuração do hotel
    const hotelConfig = await getRequestHotelConfig();

    // Validar JSON
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond(
        {
          success: false,
          message: "Invalid JSON body",
        },
        400
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
      return respond(
        {
          success: false,
          message: "Username and password are required",
        },
        400
      );
    }

    // Validar credenciais
    if (!validateCredentials(username, password, hotelConfig)) {
      const result = registerFailedAttempt(ip);

      return respond(
        {
          success: false,
          message: result.blocked
            ? "Account temporarily blocked. Try again in 20 minutes."
            : "Invalid credentials",
          attempts_remaining: result.attemptsRemaining,
        },
        result.blocked ? 429 : 401
      );
    }

    // Credenciais corretas: limpar tentativas
    resetLoginAttempts(ip);

    // Gerar Guest Token
    const token = generateToken(hotelConfig.subdomain);

    return respond({
      success: true,
      token,
      token_type: "Bearer",
      expires_in: 120,
    });

  } catch (error) {
    console.error("[GuestsCheckins] Erro:", error);

    console.log("[GuestsCheckins] Resposta enviada:", {
      status: 500,
      body: {
        success: false,
        message: "Internal server error",
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
