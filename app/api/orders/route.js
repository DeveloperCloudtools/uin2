import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const noShowStatus = await prisma.orderStatus.findFirst({
      where: { order_status_name: "No-Show" },
      select: { order_status_id: true },
    });
    if (!noShowStatus) {
      await prisma.orderStatus.create({
        data: { order_status_name: "No-Show" },
      });
    }

    const [orders, outlets, statuses] = await Promise.all([
      prisma.orders.findMany({
        include: {
          OrderStatus: {
            select: {
              order_status_id: true,
              order_status_name: true,
            },
          },
        },
        orderBy: [{ created_at: "desc" }, { order_id: "desc" }],
      }),
      prisma.outlets.findMany({
        select: {
          outlet_id: true,
          outlet_name1: true,
          outlet_name2: true,
          outlet_name3: true,
          outlet_name4: true,
          outlet_name5: true,
        },
        orderBy: { outlet_id: "asc" },
      }),
      prisma.orderStatus.findMany({
        select: {
          order_status_id: true,
          order_status_name: true,
        },
        orderBy: { order_status_id: "asc" },
      }),
    ]);

    let hasNoShowStatus = false;
    const visibleStatuses = statuses.flatMap((status) => {
      if (status.order_status_name.trim().toLowerCase() !== "no-show") {
        return [status];
      }
      if (hasNoShowStatus) return [];

      hasNoShowStatus = true;
      return [{ ...status, order_status_name: "No-Show" }];
    });

    return Response.json({ orders, statuses: visibleStatuses, outlets });
  } catch (error) {
    console.error("Não foi possível carregar os pedidos:", error);
    return Response.json(
      { error: "Não foi possível carregar os pedidos." },
      { status: 500 }
    );
  }
}
