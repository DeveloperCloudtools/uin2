export function resolveEffectivePermissions(rolePermissions = []) {
  return [...new Set(rolePermissions)].sort();
}