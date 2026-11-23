import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name?.trim()) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const reservationId = Number(rawId);
    if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
      return Response.json({ error: "ID da reserva inválido." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (body?.status !== "no-show") {
      return Response.json(
        { error: "Selecione um estado válido." },
        { status: 400 }
      );
    }

    const updatedReservation = await prisma.$transaction(async (transaction) => {
      const reservation = await transaction.reservations.findUnique({
        where: { reservation_id: reservationId },
        select: { status: true, customer_email: true },
      });
      if (!reservation) return null;
      if (reservation.status === "no-show") return reservation;

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

      const updated = await transaction.reservations.update({
        where: { reservation_id: reservationId },
        data: { status: "no-show", updated_at: new Date() },
        select: { reservation_id: true, status: true },
      });

      await transaction.notifications.create({
        data: {
          user_id: customer.id,
          title: "Reserva de mesa marcada como No-Show",
          message: `A sua reserva de mesa #${reservationId} foi marcada como No-Show.`,
        },
      });

      return updated;
    });

    if (!updatedReservation) {
      return Response.json(
        { error: "Reserva não encontrada." },
        { status: 404 }
      );
    }

    return Response.json(updatedReservation);
  } catch (error) {
    console.error("Não foi possível marcar a reserva como No-Show:", error);
    if (error.status) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "Não foi possível marcar a reserva como No-Show." },
      { status: 500 }
    );
  }
}
