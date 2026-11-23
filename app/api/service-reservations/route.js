import { prisma } from "@/lib/prisma";
import { getFoSessionUser } from "@/lib/foSession";
import {
  DEFAULT_RESERVATION_TIME_ZONE,
  getReservationTimeOptions,
  isReservationDate,
  isReservationTimeInPast,
  isValidReservationTimeZone,
  parseReservationTime,
  parseScheduleData,
} from "@/lib/tableReservation";
import { sendServiceReservationEmail } from "@/lib/serviceReservationEmail";

const DAY_KEYS = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

function isEnabled(value) {
  return value === true || value === 1 || value === "1";
}

function getScheduledTimes(schedule, date, duration, timeZone) {
  const slotDuration = Number(schedule.slotDuration);
  if (!Number.isSafeInteger(slotDuration) || slotDuration <= 0) return [];

  const scheduleData = parseScheduleData(schedule.schedule_json);
  const dayKey = DAY_KEYS[new Date(`${date}T00:00:00.000Z`).getUTCDay()];
  const ranges = scheduleData?.days?.[dayKey];
  if (!Array.isArray(ranges)) return [];

  return getReservationTimeOptions(
    schedule.schedule_json,
    date,
    slotDuration
  ).filter((time) => {
    const startMinutes = parseReservationTime(time);
    const range = ranges.find((timeRange) => {
      const rangeStart = parseReservationTime(timeRange?.start);
      const rangeEnd = parseReservationTime(timeRange?.end);
      return (
        rangeStart !== null &&
        rangeEnd !== null &&
        startMinutes >= rangeStart &&
        startMinutes < rangeEnd
      );
    });
    const rangeEnd = parseReservationTime(range?.end);
    return (
      rangeEnd !== null &&
      startMinutes + duration <= rangeEnd &&
      !isReservationTimeInPast(date, time, new Date(), timeZone)
    );
  });
}

async function getServiceContext(outletId, outletItemId, itemId) {
  let item = null;
  if (outletItemId) {
    item = await prisma.outletItems.findUnique({
      where: { outlet_item_id: outletItemId },
    });
  } else {
    item = await prisma.outletItems.findFirst({
      where: {
        outlet_id: outletId,
        item_id: itemId,
        is_reservation_item: false,
      },
    });
  }

  if (
    !item ||
    item.outlet_id !== outletId ||
    item.item_type !== "Serviço" ||
    item.is_reservation_item
  ) {
    return { error: "O serviço não está associado a este outlet.", status: 404 };
  }

  const outlet = await prisma.outlets.findUnique({
    where: { outlet_id: outletId },
    select: {
      outlet_id: true,
      outlet_name1: true,
      outlet_card_background: true,
      service_reservation: true,
    },
  });
  if (!outlet || !isEnabled(outlet.service_reservation)) {
    return {
      error: "Este outlet não permite reservas de serviços.",
      status: 404,
    };
  }

  if (!Number.isSafeInteger(item.item_duration) || item.item_duration <= 0) {
    return { error: "A duração do serviço não está configurada.", status: 409 };
  }
  if (!Number.isSafeInteger(item.schedule_id) || item.schedule_id <= 0) {
    return { error: "O serviço não tem um horário associado.", status: 409 };
  }

  const schedule = await prisma.schedules.findUnique({
    where: { schedule_id: item.schedule_id },
    select: { schedule_json: true, slotDuration: true },
  });
  if (!schedule) {
    return { error: "O horário associado ao serviço não existe.", status: 409 };
  }

  return { item, outlet, schedule };
}

function getPositiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function getTimeZone(value) {
  const timeZone = value || DEFAULT_RESERVATION_TIME_ZONE;
  return isValidReservationTimeZone(timeZone) ? timeZone : null;
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const outletId = getPositiveId(params.get("outlet_id"));
  const outletItemId = getPositiveId(params.get("outlet_item_id"));
  const itemId = getPositiveId(params.get("item_id"));
  const date = params.get("date");
  const timeZone = getTimeZone(params.get("time_zone"));

  if (
    !outletId ||
    (!outletItemId && !itemId) ||
    !isReservationDate(date) ||
    !timeZone
  ) {
    return Response.json(
      { error: "Indique um serviço, outlet e data válidos." },
      { status: 400 }
    );
  }

  try {
    const user = await getFoSessionUser();
    if (!user) {
      return Response.json(
        { error: "Inicie sessão para reservar este serviço." },
        { status: 401 }
      );
    }

    const context = await getServiceContext(outletId, outletItemId, itemId);
    if (context.error) {
      return Response.json(
        { error: context.error },
        { status: context.status }
      );
    }
    return Response.json({
      item: {
        outlet_item_id: context.item.outlet_item_id,
        item_name1: context.item.item_name1,
        item_price: context.item.item_price,
        item_duration: context.item.item_duration,
      },
      outlet_name: context.outlet.outlet_name1 || "Outlet",
      outlet_image: context.outlet.outlet_card_background || "",
      time_options: getScheduledTimes(
        context.schedule,
        date,
        context.item.item_duration,
        timeZone
      ),
    });
  } catch (error) {
    console.error("Não foi possível carregar a reserva de serviço.", error);
    return Response.json(
      { error: "Não foi possível carregar os horários do serviço." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const outletId = getPositiveId(body.outlet_id);
  const outletItemId = getPositiveId(body.outlet_item_id);
  const itemId = getPositiveId(body.item_id);
  const date = body.date;
  const startTime = body.start_time;
  const customerName =
    typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const customerSurname =
    typeof body.customer_surname === "string"
      ? body.customer_surname.trim()
      : "";
  const timeZone = getTimeZone(body.time_zone);

  if (
    !outletId ||
    (!outletItemId && !itemId) ||
    !isReservationDate(date) ||
    parseReservationTime(startTime) === null ||
    !customerName ||
    customerName.length > 150 ||
    !customerSurname ||
    customerSurname.length > 150 ||
    !timeZone
  ) {
    return Response.json(
      { error: "Indique dados de contacto, serviço, data e horário válidos." },
      { status: 400 }
    );
  }

  try {
    const user = await getFoSessionUser();
    if (!user) {
      return Response.json(
        { error: "Inicie sessão para reservar este serviço." },
        { status: 401 }
      );
    }
    if (
      typeof user.email !== "string" ||
      user.email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
    ) {
      return Response.json(
        { error: "A sua conta não tem um email válido associado." },
        { status: 409 }
      );
    }

    const context = await getServiceContext(outletId, outletItemId, itemId);
    if (context.error) {
      return Response.json(
        { error: context.error },
        { status: context.status }
      );
    }
    const timeOptions = getScheduledTimes(
      context.schedule,
      date,
      context.item.item_duration,
      timeZone
    );
    if (!timeOptions.includes(startTime)) {
      return Response.json(
        { error: "O horário selecionado não está no horário do serviço." },
        { status: 400 }
      );
    }

    const startAt = new Date(`${date}T${startTime}:00.000Z`);
    const endAt = new Date(
      startAt.getTime() + context.item.item_duration * 60 * 1000
    );
    const reservation = await prisma.$transaction(async (transaction) => {
      const created = await transaction.reservationsServices.create({
        data: {
          outlet_id: outletId,
          outlet_item_id: context.item.outlet_item_id,
          start_at: startAt,
          end_at: endAt,
          duration_minutes: context.item.item_duration,
          source: "online",
          customer_name: customerName,
          customer_surname: customerSurname,
          customer_email: user.email,
        },
        select: {
          reservation_service_id: true,
          outlet_id: true,
          outlet_item_id: true,
          start_at: true,
          end_at: true,
          duration_minutes: true,
        },
      });

      await transaction.notifications.create({
        data: {
          user_id: user.id,
          title: "Reserva de serviço aceite",
          message: `A sua reserva de serviço #${created.reservation_service_id} foi aceite.`,
        },
      });

      return created;
    });

    let emailWarning = null;
    let emailSent = false;
    try {
      await sendServiceReservationEmail({
        reservationId: reservation.reservation_service_id,
        status: "confirmed",
        customerEmail: user.email,
        customerName: `${customerName} ${customerSurname}`.trim(),
        serviceName: context.item.item_name1,
        outletName: context.outlet.outlet_name1 || "Outlet",
        startAt: new Date(`${date}T${startTime}:00.000Z`),
        durationMinutes: reservation.duration_minutes,
      });
      emailSent = true;
    } catch (emailError) {
      console.error(
        `Não foi possível enviar o email da reserva de serviço #${reservation.reservation_service_id}.`,
        emailError
      );
      emailWarning =
        "A reserva foi criada, mas não foi possível enviar o email de confirmação.";
    }

    return Response.json(
      {
        ...reservation,
        emailSent,
        ...(emailWarning ? { emailWarning } : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Não foi possível guardar a reserva de serviço.", error);
    return Response.json(
      { error: "Não foi possível guardar a reserva de serviço." },
      { status: 500 }
    );
  }
}
