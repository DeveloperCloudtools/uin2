import { sendConfiguredEmail } from "@/lib/email";

const RESERVATION_STATUS_EMAIL = {
  confirmed: {
    label: "Confirmada",
    subject: "Reserva de serviço confirmada",
    sentence: "A sua reserva de serviço foi confirmada.",
  },
  cancelled: {
    label: "Cancelada",
    subject: "Reserva de serviço cancelada",
    sentence: "A sua reserva de serviço foi cancelada.",
  },
  completed: {
    label: "Concluída",
    subject: "Reserva de serviço concluída",
    sentence: "A sua reserva de serviço foi concluída.",
  },
  "no-show": {
    label: "No-Show",
    subject: "Reserva de serviço marcada como No-Show",
    sentence: "A sua reserva de serviço foi marcada como No-Show.",
  },
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatReservationDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "UTC",
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export async function sendServiceReservationEmail({
  reservationId,
  status,
  customerEmail,
  customerName,
  serviceName,
  outletName,
  startAt,
  durationMinutes,
}) {
  const statusEmail = RESERVATION_STATUS_EMAIL[status];
  if (!statusEmail) {
    throw new Error("O estado da reserva de serviço não tem email definido.");
  }

  const date = formatReservationDate(startAt);
  const greeting = customerName ? `Olá ${customerName},` : "Olá,";
  const text = [
    greeting,
    "",
    statusEmail.sentence,
    `Referência: #${reservationId}`,
    `Serviço: ${serviceName || "Serviço"}`,
    `Local: ${outletName || "Outlet"}`,
    `Data e hora: ${date}`,
    `Duração: ${durationMinutes} minutos`,
  ].join("\n");
  const html = `
    <html>
      <body>
        <p>${escapeHtml(greeting)}</p>
        <p>${escapeHtml(statusEmail.sentence)}</p>
        <ul>
          <li><strong>Referência:</strong> #${reservationId}</li>
          <li><strong>Serviço:</strong> ${escapeHtml(serviceName || "Serviço")}</li>
          <li><strong>Local:</strong> ${escapeHtml(outletName || "Outlet")}</li>
          <li><strong>Data e hora:</strong> ${escapeHtml(date)}</li>
          <li><strong>Duração:</strong> ${escapeHtml(durationMinutes)} minutos</li>
          <li><strong>Estado:</strong> ${escapeHtml(statusEmail.label)}</li>
        </ul>
      </body>
    </html>
  `;

  await sendConfiguredEmail({
    to: customerEmail,
    subject: statusEmail.subject,
    text,
    html,
  });
}
