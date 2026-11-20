import ServiceReservationClient from "./client";

export default async function ServiceReservationPage({ searchParams }) {
  const params = await searchParams;

  return (
    <ServiceReservationClient
      outletId={params?.outlet_id || ""}
      outletItemId={params?.outlet_item_id || ""}
      itemId={params?.item_id || ""}
      authCheck={params?.auth_check || ""}
    />
  );
}
