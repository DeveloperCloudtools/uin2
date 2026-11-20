import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.name?.trim()) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const reservations = await prisma.reservationsServices.findMany({
      include: {
        Outlets: {
          select: {
            outlet_id: true,
            outlet_name1: true,
            outlet_name2: true,
            outlet_name3: true,
            outlet_name4: true,
            outlet_name5: true,
          },
        },
        OutletItems: {
          select: {
            outlet_item_id: true,
            item_name1: true,
          },
        },
      },
      orderBy: [{ start_at: "desc" }, { reservation_service_id: "desc" }],
    });

    return Response.json(reservations);
  } catch (error) {
    console.error("Não foi possível carregar as reservas de serviços:", error);
    return Response.json(
      { error: "Não foi possível carregar as reservas de serviços." },
      { status: 500 }
    );
  }
}
