import { prisma } from "@/lib/prisma";
import { validatePermission } from "@/lib/permissions";

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request, context) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ error: "ID inválido." }, { status: 400 });
  }

  const validation = validatePermission(await request.json());

  if (validation.error) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  try {
    const permission = await prisma.permissions.update({
      where: { Id: id },
      data: validation.data,
    });

    return Response.json(permission);
  } catch (error) {
    if (error.code === "P2002") {
      return Response.json(
        { error: "Já existe uma permissão com esta chave." },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return Response.json({ error: "Permissão não encontrada." }, { status: 404 });
    }

    console.error(error);
    return Response.json(
      { error: "Não foi possível atualizar a permissão." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);

  if (!id) {
    return Response.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await prisma.permissions.delete({
      where: { Id: id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    if (error.code === "P2025") {
      return Response.json({ error: "Permissão não encontrada." }, { status: 404 });
    }

    console.error(error);
    return Response.json(
      { error: "Não foi possível eliminar a permissão." },
      { status: 500 }
    );
  }
}
