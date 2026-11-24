import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = await prisma.preparationGroups.findMany({
    orderBy: { preparation_group_id: "asc" },
  });

  return Response.json(data);
}

export async function POST(req) {
  const body = await req.json();

  const created = await prisma.preparationGroups.create({
    data: {
      preparation_group_name: body.preparation_group_name || null,
    },
  });

  return Response.json(created);
}
