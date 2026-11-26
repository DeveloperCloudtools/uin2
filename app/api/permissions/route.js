import { prisma } from "@/lib/prisma";
import { validatePermission } from "@/lib/permissions";

export async function GET() {
  const permissions = await prisma.permissions.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          RolePermissions: true,
        },
      },
    },
  });

  return Response.json(permissions);
}

export async function POST(request) {
  const validation = validatePermission(await request.json());

  if (validation.error) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    const permission = await prisma.permissions.create({
      data: validation.data,
    });

    return Response.json(permission, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return Response.json(
        { error: "Já existe uma permissão com esta chave." },
        { status: 409 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Não foi possível criar a permissão." },
      { status: 500 }
    );
  }
}