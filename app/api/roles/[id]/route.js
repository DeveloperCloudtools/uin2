import { prisma } from "@/lib/prisma";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseRoleInput(body) {
  const userName = typeof body?.userName === "string" ? body.userName.trim() : "";
  const userDesc = typeof body?.userDesc === "string" ? body.userDesc.trim() : "";
  const permissionIds = body?.permissionIds;

  if (!userName || userName.length > 100) {
    return { error: "O nome da role é obrigatório e deve ter até 100 caracteres." };
  }
  if (userDesc.length > 255) {
    return { error: "A descrição deve ter até 255 caracteres." };
  }
  if (
    !Array.isArray(permissionIds) ||
    permissionIds.some((id) => !Number.isInteger(id) || id <= 0) ||
    new Set(permissionIds).size !== permissionIds.length
  ) {
    return { error: "A lista de permissões da role é inválida." };
  }
  return { data: { userName, userDesc: userDesc || null, permissionIds } };
}

export async function PUT(request, context) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return Response.json({ error: "ID de role inválido." }, { status: 400 });
  }

  const validation = parseRoleInput(await request.json());
  if (validation.error) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    const [existing, duplicate, permissionCount] = await Promise.all([
      prisma.usersBOType.findUnique({
        where: { userBOTypeID: id },
        select: { userName: true },
      }),
      prisma.usersBOType.findFirst({
        where: {
          userName: validation.data.userName,
          userBOTypeID: { not: id },
        },
        select: { userBOTypeID: true },
      }),
      prisma.permissions.count({
        where: { Id: { in: validation.data.permissionIds } },
      }),
    ]);

    if (!existing) {
      return Response.json({ error: "Role não encontrada." }, { status: 404 });
    }
    if (duplicate) {
      return Response.json(
        { error: "Já existe uma role com esse nome." },
        { status: 409 }
      );
    }
    if (
      permissionCount !== validation.data.permissionIds.length ||
      existing.userName?.trim().toLowerCase() === "administrator" &&
        validation.data.userName.toLowerCase() !== "administrator"
    ) {
      return Response.json(
        { error: "Não é possível alterar o nome Administrator ou usar permissões inválidas." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const role = await transaction.usersBOType.update({
        where: { userBOTypeID: id },
        data: {
          userName: validation.data.userName,
          userDesc: validation.data.userDesc,
        },
      });
      await transaction.rolePermissions.deleteMany({ where: { role_id: id } });
      if (validation.data.permissionIds.length) {
        await transaction.rolePermissions.createMany({
          data: validation.data.permissionIds.map((permissionId) => ({
            role_id: id,
            permission_id: permissionId,
          })),
        });
      }
      return role;
    });

    return Response.json(updated);
  } catch (error) {
    console.error("ROLE UPDATE ERROR:", error);
    return Response.json(
      { error: "Não foi possível atualizar a role." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) {
    return Response.json({ error: "ID de role inválido." }, { status: 400 });
  }

  try {
    const role = await prisma.usersBOType.findUnique({
      where: { userBOTypeID: id },
      select: { userName: true },
    });
    if (!role) {
      return Response.json({ error: "Role não encontrada." }, { status: 404 });
    }
    if (role.userName?.trim().toLowerCase() === "administrator") {
      return Response.json(
        { error: "A role Administrator não pode ser eliminada." },
        { status: 409 }
      );
    }

    const assignedUsers = await prisma.users.count({
      where: { user_type_id: id },
    });
    if (assignedUsers > 0) {
      return Response.json(
        { error: "Não é possível eliminar uma role atribuída a utilizadores." },
        { status: 409 }
      );
    }

    await prisma.usersBOType.delete({ where: { userBOTypeID: id } });
    return Response.json({ deleted: true });
  } catch (error) {
    console.error("ROLE DELETE ERROR:", error);
    return Response.json(
      { error: "Não foi possível eliminar a role." },
      { status: 500 }
    );
  }
}
