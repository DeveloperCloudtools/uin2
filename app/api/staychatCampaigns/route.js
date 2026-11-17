import { prisma } from "@/lib/prisma";
import { validateStaychatCampaign } from "@/lib/staychatCampaigns";

export async function GET() {
  try {
    const campaigns = await prisma.staychatCampaigns.findMany({
      orderBy: { staychat_campaign_id: "asc" },
    });

    return Response.json(campaigns);
  } catch (error) {
    console.error("Erro ao obter campanhas Staychat:", error);

    return Response.json(
      { error: "Não foi possível obter as campanhas Staychat." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const validation = validateStaychatCampaign(await request.json());
    if (validation.error) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const campaign = await prisma.staychatCampaigns.create({
      data: validation.data,
    });

    return Response.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Erro ao guardar campanhas Staychat:", error);

    return Response.json(
      { error: "Não foi possível guardar as campanhas Staychat." },
      { status: 500 }
    );
  }
}
