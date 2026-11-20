import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

const RESERVATION_STATUSES = new Set([
  "confirmed",
  "cancelled",
  "completed",
]);

const STATUS_LABELS = {
  confirmed: "aceite",
  cancelled: "cancelada",
  completed: "concluída",
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

    const updated = await prisma.$transaction(async (transaction) => {
      const reservation =
        await transaction.reservationsServices.findUnique({
          where: { reservation_service_id: reservationId },
          select: {
            reservation_service_id: true,
            status: true,
            customer_email: true,
          },
        });
      if (!reservation) return null;

      if (reservation.status === body.status) {
        return transaction.reservationsServices.findUnique({
          where: { reservation_service_id: reservationId },
          include: getReservationInclude(),
        });
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

      return updatedReservation;
    });

    if (!updated) {
      return Response.json(
        { error: "Reserva de serviço não encontrada." },
        { status: 404 }
      );
    }

    return Response.json(updated);
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
