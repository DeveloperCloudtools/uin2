
const protectedBackendPages = [
  ["/backend/reservations", "reservations.view"],
  ["/backend/orders", "orders.view"],
  ["/backend/service-reservations", "services.view"],
  ["/backend/permissions", "permissions"],
  ["/backend/roles", "roles"],
  ["/backend/users-bo", "usersbo"],
  ["/backend/users-fo", "usersfo.view"],
  ["/backend/advancedConfigurations", "settingspwd"],
];

function isPathWithin(pathname, basePath) {
  return (
    pathname === basePath ||
    pathname.startsWith(`${basePath}/`)
  );
}

export function getRequiredPermissions(pathname, method = "GET") {
  const normalizedMethod = method.toUpperCase();

  // Páginas protegidas do backend
  if (pathname.startsWith("/backend/")) {
    const entry = protectedBackendPages.find(([path]) =>
      isPathWithin(pathname, path)
    );

    return entry ? [entry[1]] : null;
  }

  // APIs
  if (!pathname.startsWith("/api/")) return null;

  // Reservas
  if (isPathWithin(pathname, "/api/reservations")) {
    return ["reservations.view"];
  }

  // Pedidos
  if (isPathWithin(pathname, "/api/orders")) {
    return ["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)
      ? ["orders.view"]
      : ["orders.edit"];
  }

  // Serviços e reservas de serviços
  if (
    isPathWithin(pathname, "/api/services") ||
    isPathWithin(pathname, "/api/service-reservations")
  ) {
    return ["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)
      ? ["services.view"]
      : ["services.edit"];
  }

  // Gestão de permissões
  if (isPathWithin(pathname, "/api/permissions")) {
    return ["permissions"];
  }

  // Gestão de roles
  if (isPathWithin(pathname, "/api/roles")) {
    return ["roles"];
  }

  // Gestão de utilizadores BO
  if (isPathWithin(pathname, "/api/users")) {
    return ["usersbo"];
  }

  // Gestão de utilizadores FO
  if (isPathWithin(pathname, "/api/users-fo")) {
    return ["usersfo.view"];
  }

  // Configurações
  if (isPathWithin(pathname, "/api/settings")) {
    return ["settingspwd"];
  }

  return null;
}

export function hasAnyPermission(token, requiredPermissions) {
  // Sem permissões específicas exigidas
  if (!requiredPermissions) return true;

  // Administrator tem acesso total
  if (token?.isAdministrator) return true;

  // Permissões herdadas da RolePermissions
  if (!Array.isArray(token?.permissionKeys)) return false;

  return requiredPermissions.some((permission) =>
    token.permissionKeys.includes(permission)
  );
}
