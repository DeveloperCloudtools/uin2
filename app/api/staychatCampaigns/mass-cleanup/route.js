import { prisma } from "@/lib/prisma";
import {
  getStaychatCampaignItems,
  staychatCampaignFields,
} from "@/lib/staychatCampaignItems";

const itemsWithActiveCampaigns = {
  OR: staychatCampaignFields.map((field) => ({ [field]: true })),
};

export async function GET() {
  try {
    const items = await getStaychatCampaignItems(itemsWithActiveCampaigns);
    return Response.json(items);
  } catch (error) {
    console.error("Erro ao carregar itens para limpeza massiva Staychat:", error);
    return Response.json(
      { error: "Não foi possível carregar os itens com campanhas ativas." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const itemIds = body?.outletItemIds;
    const fields = body?.campaignFields;

    if (
      !Array.isArray(itemIds) ||
      itemIds.length === 0 ||
      itemIds.some((id) => !Number.isSafeInteger(id) || id <= 0)
    ) {
      return Response.json(
        { error: "Indique os itens válidos que pretende limpar." },
        { status: 400 }
      );
    }
    if (
      !Array.isArray(fields) ||
      fields.length === 0 ||
      fields.some((field) => !staychatCampaignFields.includes(field)) ||
      new Set(fields).size !== fields.length
    ) {
      return Response.json(
        { error: "Selecione pelo menos um estado de campanha válido para limpar." },
        { status: 400 }
      );
    }

    const result = await prisma.outletItems.updateMany({
      where: {
        outlet_item_id: { in: [...new Set(itemIds)] },
        OR: fields.map((field) => ({ [field]: true })),
      },
      data: Object.fromEntries(
        fields.flatMap((field) => [
          [field, false],
          [`${field}_campaign_id`, null],
        ])
      ),
    });

    return Response.json({ cleanedCount: result.count });
  } catch (error) {
    console.error("Erro ao limpar campanhas Staychat em massa:", error);
    return Response.json(
      { error: "Não foi possível limpar as campanhas nos itens." },
      { status: 500 }
    );
  }
}
