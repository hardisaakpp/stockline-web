import { describe, expect, it } from "vitest";
import { can, canAny, PERMISSIONS } from "./permissions";

const buyer = { permissions: ["orders.view", "orders.import"] };

describe("permissions", () => {
  it("grants only what the user holds", () => {
    expect(can(buyer, PERMISSIONS.ordersImport)).toBe(true);
    expect(can(buyer, PERMISSIONS.adminUsers)).toBe(false);
  });

  it("denies everything to an anonymous visitor", () => {
    expect(can(null, PERMISSIONS.ordersView)).toBe(false);
    expect(can(undefined, PERMISSIONS.ordersView)).toBe(false);
    expect(canAny(null, [PERMISSIONS.ordersView])).toBe(false);
  });

  it("canAny needs at least one match", () => {
    expect(canAny(buyer, [PERMISSIONS.adminUsers, PERMISSIONS.ordersView])).toBe(true);
    expect(canAny(buyer, [PERMISSIONS.adminUsers, PERMISSIONS.erpSubmit])).toBe(false);
    expect(canAny(buyer, [])).toBe(false);
  });
});
