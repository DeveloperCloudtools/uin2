import { prisma } from "@/lib/prisma";
import { validateStaychatCampaign } from "@/lib/staychatCampaigns";
import { staychatCampaignFields } from "@/lib/staychatCampaignItems";

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PUT(request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    if (!id) {
      return Response.json({ error: "ID da campanha inválido." }, { status: 400 });
    }

    const validation = validateStaychatCampaign(await request.json());
    if (validation.error) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const campaign = await prisma.staychatCampaigns.update({
      where: { staychat_campaign_id: id },
      data: validation.data,
    });

    return Response.json(campaign);
  } catch (error) {
    if (error.code === "P2025") {
      return Response.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    console.error("Erro ao atualizar campanha Staychat:", error);
    return Response.json(
      { error: "Não foi possível atualizar a campanha Staychat." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    if (!id) {
      return Response.json({ error: "ID da campanha inválido." }, { status: 400 });
    }

    const associatedItem = await prisma.outletItems.findFirst({
      where: {
        OR: staychatCampaignFields.map((field) => ({
          [`${field}_campaign_id`]: id,
        })),
      },
      select: { outlet_item_id: true },
    });
    if (associatedItem) {
      return Response.json(
        {
          error:
            "Esta campanha está associada a itens. Remova as associações antes de a eliminar.",
        },
        { status: 409 }
      );
    }

    await prisma.staychatCampaigns.delete({
      where: { staychat_campaign_id: id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    if (error.code === "P2025") {
      return Response.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    console.error("Erro ao eliminar campanha Staychat:", error);
    return Response.json(
      { error: "Não foi possível eliminar a campanha Staychat." },
      { status: 500 }
    );
  }
}
