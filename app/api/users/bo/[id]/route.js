
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request, context) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json(
      { error: "ID de utilizador inválido." },
      { status: 400 }
    );
  }

  const body = await request.json();

  if (typeof body?.active !== "boolean") {
    return Response.json(
      { error: "O estado ativo é obrigatório." },
      { status: 400 }
    );
  }

  const roleId =
    body.user_type_id === null || body.user_type_id === ""
      ? null
      : Number(body.user_type_id);

  if (
    roleId !== null &&
    (!Number.isInteger(roleId) || roleId <= 0)
  ) {
    return Response.json(
      { error: "A role selecionada é inválida." },
      { status: 400 }
    );
  }

  // Validar data de expiração
  const hasExpirationDate =
    body.expired_at !== null &&
    body.expired_at !== undefined &&
    body.expired_at !== "";

  let expiredAt = null;

  if (hasExpirationDate) {
    if (
      typeof body.expired_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.expired_at)
    ) {
      return Response.json(
        { error: "A data de expiração é inválida." },
        { status: 400 }
      );
    }

    expiredAt = new Date(
      `${body.expired_at}T00:00:00.000Z`
    );

    if (
      Number.isNaN(expiredAt.getTime()) ||
      expiredAt.toISOString().slice(0, 10) !== body.expired_at
    ) {
      return Response.json(
        { error: "A data de expiração é inválida." },
        { status: 400 }
      );
    }
  }

  // Impedir que um utilizador fique ativo com uma data expirada
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (expiredAt && expiredAt <= today && body.active) {
    return Response.json(
      {
        error:
          "Não pode ativar um utilizador cuja data de expiração já chegou ou passou.",
      },
      { status: 400 }
    );
  }

  try {
    const [user, role, session] = await Promise.all([
      prisma.users.findUnique({
        where: { user_id: id },
        select: {
          user_id: true,
          user_type_id: true,
          active: true,
        },
      }),

      roleId === null
        ? Promise.resolve(null)
        : prisma.usersBOType.findUnique({
            where: { userBOTypeID: roleId },
            select: {
              userBOTypeID: true,
              userName: true,
            },
          }),

      getServerSession(authOptions),
    ]);

    if (!user) {
      return Response.json(
        { error: "Utilizador BO não encontrado." },
        { status: 404 }
      );
    }

    if (roleId !== null && !role) {
      return Response.json(
        { error: "A role não existe." },
        { status: 400 }
      );
    }

    // Impedir que o utilizador altere a própria conta
    if (
      Number(session?.user?.id) === id &&
      (!body.active || roleId !== user.user_type_id)
    ) {
      return Response.json(
        { error: "Não pode desativar ou alterar a própria role." },
        { status: 409 }
      );
    }

    // Verificar se está a remover o último administrador
    const currentRole = user.user_type_id
      ? await prisma.usersBOType.findUnique({
          where: { userBOTypeID: user.user_type_id },
          select: { userName: true },
        })
      : null;

    const isRemovingAdministrator =
      currentRole?.userName?.trim().toLowerCase() === "administrator" &&
      (!body.active || roleId !== user.user_type_id);

    if (isRemovingAdministrator) {
      const otherAdministrators = await prisma.users.count({
        where: {
          active: true,
          user_id: { not: id },
          user_type_id: user.user_type_id,
        },
      });

      if (otherAdministrators === 0) {
        return Response.json(
          {
            error:
              "Não pode desativar ou remover a última conta Administrator.",
          },
          { status: 409 }
        );
      }
    }

    // Atualizar apenas os dados do utilizador
    await prisma.users.update({
      where: { user_id: id },
      data: {
        active: body.active,
        user_type_id: roleId,
        expired_at: expiredAt,
      },
    });

    return Response.json({ updated: true });
  } catch (error) {
    console.error("BO USER UPDATE ERROR:", error);

    return Response.json(
      { error: "Não foi possível atualizar o utilizador BO." },
      { status: 500 }
    );
  }
}
