import assert from "node:assert/strict";
import test from "node:test";
import { resolveEffectivePermissions } from "./effectivePermissions.mjs";

test("applies user-specific allow and deny overrides over role permissions", () => {
  assert.deepEqual(
    resolveEffectivePermissions(
      ["menus.view", "menus.manage"],
      [
        { permission_key: "menus.manage", effect: "DENY" },
        { permission_key: "users.view", effect: "ALLOW" },
      ]
    ),
    ["menus.view", "users.view"]
  );
});
