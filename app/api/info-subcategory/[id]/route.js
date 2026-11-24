import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id } = await params;

  const data = await prisma.infoSubcategory.findFirst({
    where: {
      subcategory_id: Number(id),
    },
  });

  return Response.json(data);
}