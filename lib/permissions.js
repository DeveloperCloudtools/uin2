export function validatePermission(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Dados inválidos." };
  }

  const permissionKey =
    typeof body.permission_key === "string"
      ? body.permission_key.trim().toLowerCase()
      : "";
  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const moduleName =
    typeof body.module === "string" ? body.module.trim() : "";
  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  if (!/^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/.test(permissionKey)) {
    return {
      error:
        "A chave deve usar letras minúsculas, números e os separadores . _ : ou -.",
    };
  }

  if (permissionKey.length > 150) {
    return { error: "A chave deve ter no máximo 150 caracteres." };
  }

  if (!name || name.length > 150) {
    return { error: "O nome é obrigatório e deve ter no máximo 150 caracteres." };
  }

  if (!moduleName || moduleName.length > 100) {
    return { error: "O módulo é obrigatório e deve ter no máximo 100 caracteres." };
  }

  if (description.length > 255) {
    return { error: "A descrição deve ter no máximo 255 caracteres." };
  }

  return {
    data: {
      permission_key: permissionKey,
      name,
      module: moduleName,
      description: description || null,
    },
  };
}
