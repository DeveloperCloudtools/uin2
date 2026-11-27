
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 20 * 60 * 1000; // 20 minutos

const attempts = new Map();

export function checkLoginAttempts(ip) {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    return { blocked: false };
  }

  // Verificar se ainda está bloqueado
  if (record.blockedUntil && now < record.blockedUntil) {
    return {
      blocked: true,
      remainingTime: Math.ceil(
        (record.blockedUntil - now) / 1000
      ),
    };
  }

  // Se o bloqueio terminou, reiniciar
  if (record.blockedUntil && now >= record.blockedUntil) {
    attempts.delete(ip);
    return { blocked: false };
  }

  return { blocked: false };
}

export function registerFailedAttempt(ip) {
  const now = Date.now();

  let record = attempts.get(ip) || {
    count: 0,
    blockedUntil: null,
  };

  record.count++;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION;
  }

  attempts.set(ip, record);

  return {
    blocked: record.count >= MAX_ATTEMPTS,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.count),
  };
}

export function resetLoginAttempts(ip) {
  attempts.delete(ip);
}
