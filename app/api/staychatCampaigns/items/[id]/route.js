import { prisma } from "@/lib/prisma";

const campaignsByItemType = {
  Produto: [
    "product_accept",
    "product_in_progress",
    "product_completed",
    "product_cancelled",
  ],
  Serviço: ["service_confirmed", "service_modified", "service_cancelled"],
  "Reserva de mesa": ["reservation_confirmed", "reservation_cancelled"],
};

export async function PATCH(request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ error: "ID do item inválido." }, { status: 400 });
    }

    const body = await request.json();
    const campaigns = body?.campaigns;
    if (!campaigns || typeof campaigns !== "object" || Array.isArray(campaigns)) {
      return Response.json(
        { error: "Indique as campanhas do item." },
        { status: 400 }
      );
    }
    const campaignIds = body?.campaignIds;
    if (
      !campaignIds ||
      typeof campaignIds !== "object" ||
      Array.isArray(campaignIds)
    ) {
      return Response.json(
        { error: "Indique as campanhas associadas ao item." },
        { status: 400 }
      );
    }

    const item = await prisma.outletItems.findUnique({
      where: { outlet_item_id: id },
      select: {
        outlet_item_id: true,
        item_type: true,
        sendStaychat: true,
      },
    });
    if (!item || item.sendStaychat !== "1" || !campaignsByItemType[item.item_type]) {
      return Response.json(
        { error: "O item não está disponível para configuração Staychat." },
        { status: 404 }
      );
    }

    const allowedFields = campaignsByItemType[item.item_type];
    if (
      Object.keys(campaigns).length !== allowedFields.length ||
      Object.keys(campaignIds).length !== allowedFields.length ||
      allowedFields.some(
        (field) => typeof campaigns[field] !== "boolean"
      ) ||
      allowedFields.some(
        (field) =>
          (campaigns[field] &&
            (!Number.isSafeInteger(campaignIds[field]) ||
              campaignIds[field] <= 0)) ||
          (!campaigns[field] && campaignIds[field] !== null)
      ) ||
      Object.keys(campaigns).some((field) => !allowedFields.includes(field)) ||
      Object.keys(campaignIds).some((field) => !allowedFields.includes(field))
    ) {
      return Response.json(
        { error: "Selecione uma campanha para cada estado ativo do item." },
        { status: 400 }
      );
    }

    const selectedCampaignIds = [
      ...new Set(Object.values(campaignIds).filter((value) => value !== null)),
    ];
    const existingCampaigns = await prisma.staychatCampaigns.findMany({
      where: { staychat_campaign_id: { in: selectedCampaignIds } },
      select: { staychat_campaign_id: true },
    });
    if (existingCampaigns.length !== selectedCampaignIds.length) {
      return Response.json(
        { error: "Uma ou mais campanhas selecionadas já não existem." },
        { status: 400 }
      );
    }

    const result = await prisma.outletItems.updateMany({
      where: {
        outlet_item_id: id,
        sendStaychat: "1",
        item_type: item.item_type,
      },
      data: {
        ...campaigns,
        ...Object.fromEntries(
          allowedFields.map((field) => [
            `${field}_campaign_id`,
            campaignIds[field],
          ])
        ),
      },
    });
    if (result.count !== 1) {
      return Response.json(
        { error: "O item deixou de estar disponível para configuração Staychat." },
        { status: 409 }
      );
    }

    return Response.json({ campaigns, campaignIds });
  } catch (error) {
    console.error("Erro ao guardar campanhas do item Staychat:", error);
    return Response.json(
      { error: "Não foi possível guardar as campanhas do item." },
      { status: 500 }
    );
  }
}
