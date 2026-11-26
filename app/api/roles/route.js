import { prisma } from "@/lib/prisma";

function parseRoleInput(body) {
  const name = typeof body?.userName === "string" ? body.userName.trim() : "";
  const description =
    typeof body?.userDesc === "string" ? body.userDesc.trim() : "";
  const permissionIds = body?.permissionIds;

  if (!name || name.length > 100) {
    return { error: "O nome da role é obrigatório e deve ter até 100 caracteres." };
  }
  if (description.length > 255) {
    return { error: "A descrição deve ter até 255 caracteres." };
  }
  if (
    !Array.isArray(permissionIds) ||
    permissionIds.some(
      (id) => !Number.isInteger(id) || id <= 0
    ) ||
    new Set(permissionIds).size !== permissionIds.length
  ) {
    return { error: "A lista de permissões da role é inválida." };
  }

  return { data: { userName: name, userDesc: description || null, permissionIds } };
}

async function getRoleSummaries(roles) {
  const roleIds = roles.map((role) => role.userBOTypeID);
  const [users, assignments] = await Promise.all([
    prisma.users.findMany({
      where: { user_type_id: { in: roleIds } },
      select: { user_type_id: true },
    }),
    prisma.rolePermissions.findMany({
      where: { role_id: { in: roleIds } },
      include: {
        Permissions: {
          select: { Id: true, permission_key: true, name: true, module: true },
        },
      },
    }),
  ]);
  const userCounts = new Map();
  for (const user of users) {
    userCounts.set(
      user.user_type_id,
      (userCounts.get(user.user_type_id) || 0) + 1
    );
  }
  const permissionsByRole = new Map();
  for (const assignment of assignments) {
    const permissions = permissionsByRole.get(assignment.role_id) || [];
    permissions.push(assignment.Permissions);
    permissionsByRole.set(assignment.role_id, permissions);
  }

  return roles.map((role) => ({
    ...role,
    userCount: userCounts.get(role.userBOTypeID) || 0,
    permissions: permissionsByRole.get(role.userBOTypeID) || [],
  }));
}

export async function GET() {
  try {
    const roles = await prisma.usersBOType.findMany({
      orderBy: { userName: "asc" },
    });
    return Response.json(await getRoleSummaries(roles));
  } catch (error) {
    console.error("ROLE LIST ERROR:", error);
    return Response.json(
      { error: "Não foi possível carregar as roles." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const validation = parseRoleInput(await request.json());
  if (validation.error) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    const duplicate = await prisma.usersBOType.findFirst({
      where: { userName: validation.data.userName },
      select: { userBOTypeID: true },
    });
    if (duplicate) {
      return Response.json(
        { error: "Já existe uma role com esse nome." },
        { status: 409 }
      );
    }

    const permissionCount = await prisma.permissions.count({
      where: { Id: { in: validation.data.permissionIds } },
    });
    if (permissionCount !== validation.data.permissionIds.length) {
      return Response.json(
        { error: "Uma ou mais permissões selecionadas não existem." },
        { status: 400 }
      );
    }

    const role = await prisma.$transaction(async (transaction) => {
      const created = await transaction.usersBOType.create({
        data: {
          userName: validation.data.userName,
          userDesc: validation.data.userDesc,
        },
      });
      if (validation.data.permissionIds.length) {
        await transaction.rolePermissions.createMany({
          data: validation.data.permissionIds.map((permissionId) => ({
            role_id: created.userBOTypeID,
            permission_id: permissionId,
          })),
        });
      }
      return created;
    });

    return Response.json(role, { status: 201 });
  } catch (error) {
    console.error("ROLE CREATE ERROR:", error);
    return Response.json(
      { error: "Não foi possível criar a role." },
      { status: 500 }
    );
  }
}
