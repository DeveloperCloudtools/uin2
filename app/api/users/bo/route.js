
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      orderBy: { username: "asc" },
      select: {
        user_id: true,
        username: true,
        created_at: true,
        last_login: true,
        user_type_id: true,
        active: true,
        expired_at: true,
      },
    });

    const roleIds = [
      ...new Set(
        users
          .map((user) => user.user_type_id)
          .filter((id) => id !== null)
      ),
    ];

    const [roles, roleAssignments] = await Promise.all([
      prisma.usersBOType.findMany({
        where: {
          userBOTypeID: { in: roleIds },
        },
        select: {
          userBOTypeID: true,
          userName: true,
        },
      }),

      prisma.rolePermissions.findMany({
        where: {
          role_id: { in: roleIds },
        },
        select: {
          role_id: true,
          permission_id: true,
          Permissions: {
            select: {
              permission_key: true,
              name: true,
              module: true,
            },
          },
        },
      }),
    ]);

    const rolesById = new Map(
      roles.map((role) => [role.userBOTypeID, role])
    );

    const rolePermissionsById = new Map();

    for (const assignment of roleAssignments) {
      const permissions =
        rolePermissionsById.get(assignment.role_id) ?? [];

      permissions.push({
        permission_id: assignment.permission_id,
        permission_key: assignment.Permissions.permission_key,
        name: assignment.Permissions.name,
        module: assignment.Permissions.module,
      });

      rolePermissionsById.set(
        assignment.role_id,
        permissions
      );
    }

    return Response.json(
      users.map((user) => {
        const permissions =
          rolePermissionsById.get(user.user_type_id) ?? [];

        return {
          ...user,
          role: rolesById.get(user.user_type_id) ?? null,
          rolePermissionIds: permissions.map(
            (permission) => permission.permission_id
          ),
          permissions,
        };
      })
    );
  } catch (error) {
    console.error("BO USER LIST ERROR:", error);

    return Response.json(
      { error: "Não foi possível carregar os utilizadores BO." },
      { status: 500 }
    );
  }
}
