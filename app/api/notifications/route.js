import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";


async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("userFOSession")?.value;

  if (!sessionToken) {
    return {
      response: Response.json(
        { message: "Sessão não autenticada." },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.users_FO.findFirst({
    where: {
      session_token: sessionToken,
      session_expires_at: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return {
      response: Response.json(
        { message: "Sessão inválida ou expirada." },
        { status: 401 }
      ),
    };
  }

  return { user };
}

async function findUserNotifications(userId) {
  return prisma.notifications.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 20,
    select: {
      notification_id: true,
      title: true,
      message: true,
      is_read: true,
      created_at: true,
    },
  });
}

export async function GET() {
  try {
    const { user, response } = await getAuthenticatedUser();
    if (response) return response;

    return Response.json(await findUserNotifications(user.id));
  } catch (error) {
    console.error("Erro ao carregar notificações:", error);
    return Response.json(
      { message: "Não foi possível carregar as notificações." },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const { user, response } = await getAuthenticatedUser();
    if (response) return response;

    const [unreadCount, totalCount] = await Promise.all([
      prisma.notifications.count({
        where: {
          user_id: user.id,
          OR: [{ is_read: false }, { is_read: null }],
        },
      }),
      prisma.notifications.count({ where: { user_id: user.id } }),
    ]);

    await prisma.notifications.updateMany({
      where: { user_id: user.id },
      data: { is_read: true },
    });

    return Response.json({
      notifications: await findUserNotifications(user.id),
      unreadCount,
      totalCount,
    });
  } catch (error) {
    console.error("Erro ao marcar notificações como lidas:", error);
    return Response.json(
      { message: "Não foi possível marcar as notificações como lidas." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { user, response } = await getAuthenticatedUser();
    if (response) return response;

    const result = await prisma.notifications.deleteMany({
      where: { user_id: user.id },
    });

    return Response.json({ deletedCount: result.count });
  } catch (error) {
    console.error("Erro ao descartar notificações:", error);
    return Response.json(
      { message: "Não foi possível descartar as notificações." },
      { status: 500 }
    );
  }
}
