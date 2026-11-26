
import assert from "node:assert/strict";
import test from "node:test";

import {
  getRequiredPermissions,
  hasAnyPermission,
} from "./backendAccess.mjs";

test("protects only the configured backend pages", () => {
  assert.deepEqual(
    getRequiredPermissions("/backend/reservations"),
    ["reservations.view"]
  );

  assert.deepEqual(
    getRequiredPermissions("/backend/orders"),
    ["orders.view"]
  );

  assert.deepEqual(
    getRequiredPermissions("/backend/service-reservations"),
    ["services.view"]
  );

  assert.equal(
    getRequiredPermissions("/backend/products"),
    null
  );

  assert.equal(
    getRequiredPermissions("/backend/users-bo"),
    null
  );
});

test("protects only the configured API modules", () => {
  assert.deepEqual(
    getRequiredPermissions("/api/reservations", "GET"),
    ["reservations.view"]
  );

  assert.deepEqual(
    getRequiredPermissions("/api/orders", "GET"),
    ["orders.view"]
  );

  assert.deepEqual(
    getRequiredPermissions("/api/orders/12", "PUT"),
    ["orders.edit"]
  );

  assert.deepEqual(
    getRequiredPermissions("/api/services", "GET"),
    ["services.view"]
  );

  assert.deepEqual(
    getRequiredPermissions("/api/service-reservations", "POST"),
    ["services.edit"]
  );

  assert.equal(
    getRequiredPermissions("/api/products", "POST"),
    null
  );

  assert.equal(
    getRequiredPermissions("/api/areas/12", "PUT"),
    null
  );
});

test("allows administrators and explicit permission keys", () => {
  assert.equal(
    hasAnyPermission(
      { isAdministrator: true },
      ["reservations.view"]
    ),
    true
  );

  assert.equal(
    hasAnyPermission(
      { permissionKeys: ["reservations.view"] },
      ["reservations.view"]
    ),
    true
  );

  assert.equal(
    hasAnyPermission(
      { permissionKeys: ["orders.view"] },
      ["orders.edit"]
    ),
    false
  );

  assert.equal(
    hasAnyPermission(
      { permissionKeys: [] },
      ["services.view"]
    ),
    false
  );
});
