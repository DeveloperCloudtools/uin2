import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { sendServiceReservationEmail } from "@/lib/serviceReservationEmail";

const RESERVATION_STATUSES = new Set([
  "confirmed",
  "cancelled",
  "completed",
  "no-show",
]);

const STATUS_LABELS = {
  confirmed: "aceite",
  cancelled: "cancelada",
  completed: "concluída",
  "no-show": "marcada como No-Show",
};

function getReservationInclude() {
  return {
    Outlets: {
      select: {
        outlet_id: true,
        outlet_name1: true,
        outlet_name2: true,
        outlet_name3: true,
        outlet_name4: true,
        outlet_name5: true,
      },
    },
    OutletItems: {
      select: {
        outlet_item_id: true,
        item_name1: true,
      },
    },
  };
}

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    const updatedBy = session?.user?.name?.trim();
    if (!updatedBy) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const reservationId = Number(rawId);
    if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
      return Response.json(
        { error: "ID da reserva de serviço inválido." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!RESERVATION_STATUSES.has(body?.status)) {
      return Response.json(
        { error: "Selecione um estado válido." },
        { status: 400 }
      );
    }

    const updateResult = await prisma.$transaction(async (transaction) => {
      const reservation =
        await transaction.reservationsServices.findUnique({
          where: { reservation_service_id: reservationId },
          include: getReservationInclude(),
        });
      if (!reservation) return null;

      if (reservation.status === body.status) {
        return { reservation, statusChanged: false };
      }

      const customer = reservation.customer_email
        ? await transaction.users_FO.findFirst({
            where: { email: reservation.customer_email },
            select: { id: true },
          })
        : null;
      if (!customer) {
        const error = new Error(
          "Não foi possível identificar o cliente desta reserva para enviar a notificação."
        );
        error.status = 409;
        throw error;
      }

      const updatedReservation =
        await transaction.reservationsServices.update({
          where: { reservation_service_id: reservationId },
          data: {
            status: body.status,
            updated_at: new Date(),
            updated_by: updatedBy,
          },
          include: getReservationInclude(),
        });

      await transaction.notifications.create({
        data: {
          user_id: customer.id,
          title: `Reserva de serviço ${STATUS_LABELS[body.status]}`,
          message: `A sua reserva de serviço #${reservationId} foi ${STATUS_LABELS[body.status]}.`,
        },
      });

      return { reservation: updatedReservation, statusChanged: true };
    });

    if (!updateResult) {
      return Response.json(
        { error: "Reserva de serviço não encontrada." },
        { status: 404 }
      );
    }

    let emailWarning = null;
    let emailSent = false;
    if (updateResult.statusChanged) {
      const reservation = updateResult.reservation;
      try {
        await sendServiceReservationEmail({
          reservationId,
          status: body.status,
          customerEmail: reservation.customer_email,
          customerName: [reservation.customer_name, reservation.customer_surname]
            .filter(Boolean)
            .join(" "),
          serviceName: reservation.OutletItems?.item_name1,
          outletName:
            reservation.Outlets?.outlet_name1 ||
            reservation.Outlets?.outlet_name2 ||
            "Outlet",
          startAt: reservation.start_at,
          durationMinutes: reservation.duration_minutes,
        });
        emailSent = true;
      } catch (emailError) {
        console.error(
          `Não foi possível enviar o email da reserva de serviço #${reservationId}.`,
          emailError
        );
        emailWarning =
          "O estado foi atualizado, mas não foi possível enviar o email.";
      }
    }

    return Response.json({
      ...updateResult.reservation,
      emailSent,
      ...(emailWarning ? { emailWarning } : {}),
    });
  } catch (error) {
    console.error("Não foi possível atualizar o estado da reserva de serviço:", error);
    if (error.status) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "Não foi possível atualizar o estado da reserva de serviço." },
      { status: 500 }
    );
  }
}
