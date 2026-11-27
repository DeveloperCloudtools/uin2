
import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";

const TOKEN_DURATION = 2 * 60; // 2 minutos

function getSecret() {
  const secret = process.env.GUESTS_CHECKINS_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "GUESTS_CHECKINS_SECRET deve ter pelo menos 32 caracteres."
    );
  }

  return secret;
}

// Comparação segura de credenciais
function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

// Validar username e password do hotel
export function validateCredentials(username, password, hotelConfig) {
  if (
    !hotelConfig?.GUESTS_CHECKINS_USERNAME ||
    !hotelConfig?.GUESTS_CHECKINS_PASSWORD
  ) {
    throw new Error("Credenciais da API não configuradas para este hotel.");
  }

  return (
    safeCompare(username, hotelConfig.GUESTS_CHECKINS_USERNAME) &&
    safeCompare(password, hotelConfig.GUESTS_CHECKINS_PASSWORD)
  );
}

// Gerar Guest Token
export function generateToken(subdomain) {
  const payload = {
    jti: randomBytes(32).toString("hex"),
    subdomain,
    exp: Math.floor(Date.now() / 1000) + TOKEN_DURATION,
  };

  const encodedPayload = Buffer
    .from(JSON.stringify(payload))
    .toString("base64url");

  const signature = createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

// Validar Guest Token
export function validateToken(token, expectedSubdomain) {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) {
      return false;
    }

    const [payload, signature] = parts;

    if (!payload || !signature) {
      return false;
    }

    const expectedSignature = createHmac("sha256", getSecret())
      .update(payload)
      .digest("base64url");

    if (!safeCompare(signature, expectedSignature)) {
      return false;
    }

    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (!decoded.jti || !decoded.exp || !decoded.subdomain) {
      return false;
    }

    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
      return false;
    }

    if (decoded.subdomain !== expectedSubdomain) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
