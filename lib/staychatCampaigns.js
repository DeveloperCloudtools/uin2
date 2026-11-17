export function validateStaychatCampaign(body) {
  const campaign_name =
    typeof body?.campaign_name === "string" ? body.campaign_name.trim() : "";
  const campaign_id =
    typeof body?.campaign_id === "string" ? body.campaign_id.trim() : "";

  if (!campaign_name || !campaign_id) {
    return { error: "Indique o nome e o ID da campanha." };
  }
  if (campaign_name.length > 200 || campaign_id.length > 200) {
    return {
      error: "O nome e o ID da campanha podem ter no máximo 200 caracteres.",
    };
  }

  return { data: { campaign_name, campaign_id } };
}
