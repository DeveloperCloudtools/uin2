import { prisma } from "@/lib/prisma";
import { getStaychatCampaignItems } from "@/lib/staychatCampaignItems";

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
const campaignFields = Object.values(campaignsByItemType).flat();
const itemTypes = Object.keys(campaignsByItemType);

export async function GET() {
  try {
    const items = await getStaychatCampaignItems({
        sendStaychat: "1",
        item_type: { in: itemTypes },
    });
    return Response.json(items);
  } catch (error) {
    console.error("Erro ao carregar itens Staychat para atualização massiva:", error);
    return Response.json(
      { error: "Não foi possível carregar os itens Staychat." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const assignments = body?.campaignAssignments;
    const itemIds = body?.outletItemIds;

    if (
      !assignments ||
      typeof assignments !== "object" ||
      Array.isArray(assignments) ||
      Object.keys(assignments).length === 0 ||
      Object.entries(assignments).some(
        ([field, campaignId]) =>
          !campaignFields.includes(field) ||
          !Number.isSafeInteger(campaignId) ||
          campaignId <= 0
      )
    ) {
      return Response.json(
        { error: "Selecione estados válidos e associe uma campanha a cada um." },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(itemIds) ||
      itemIds.length === 0 ||
      itemIds.some(
        (id) => !Number.isSafeInteger(id) || id <= 0
      )
    ) {
      return Response.json(
        { error: "Selecione pelo menos um item válido." },
        { status: 400 }
      );
    }

    const campaignIds = [...new Set(Object.values(assignments))];
    const existingCampaigns = await prisma.staychatCampaigns.findMany({
      where: { staychat_campaign_id: { in: campaignIds } },
      select: { staychat_campaign_id: true },
    });
    if (existingCampaigns.length !== campaignIds.length) {
      return Response.json(
        { error: "Uma ou mais campanhas selecionadas já não existem." },
        { status: 400 }
      );
    }

    const updatedCount = await prisma.$transaction(async (transaction) => {
      const selectedItems = await transaction.outletItems.findMany({
        where: {
          outlet_item_id: { in: [...new Set(itemIds)] },
          sendStaychat: "1",
          item_type: { in: itemTypes },
        },
        select: { outlet_item_id: true, item_type: true },
      });

      let totalUpdated = 0;
      for (const [itemType, supportedFields] of Object.entries(
        campaignsByItemType
      )) {
        const applicableAssignments = Object.entries(assignments).filter(
          ([field]) => supportedFields.includes(field)
        );
        const matchingItemIds = selectedItems
          .filter((item) => item.item_type === itemType)
          .map((item) => item.outlet_item_id);

        if (
          applicableAssignments.length === 0 ||
          matchingItemIds.length === 0
        ) {
          continue;
        }

        const result = await transaction.outletItems.updateMany({
          where: {
            outlet_item_id: { in: matchingItemIds },
            sendStaychat: "1",
            item_type: itemType,
          },
          data: Object.fromEntries(
            applicableAssignments.flatMap(([field, campaignId]) => [
              [field, true],
              [`${field}_campaign_id`, campaignId],
            ])
          ),
        });
        totalUpdated += result.count;
      }

      return totalUpdated;
    });

    return Response.json({ updatedCount });
  } catch (error) {
    console.error("Erro ao atualizar campanhas Staychat em massa:", error);
    return Response.json(
      { error: "Não foi possível atualizar as campanhas nos itens." },
      { status: 500 }
    );
  }
}
