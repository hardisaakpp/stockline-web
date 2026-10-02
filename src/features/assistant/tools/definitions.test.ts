import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "@/features/orders";
import { toolsFor } from "./definitions";

const names = (permissions: string[]) => toolsFor({ permissions }).map((tool) => tool.nombre);

describe("toolsFor", () => {
  it("offers only the tools a person holds the permission for", () => {
    expect(names(["orders.view"])).toEqual(["search_orders", "get_order"]);
    expect(names(["dashboard.view"])).toEqual(["orders_summary"]);
    expect(names(["orders.view", "dashboard.view"])).toEqual([
      "search_orders",
      "get_order",
      "orders_summary",
    ]);
  });

  it("offers nothing without permissions", () => {
    expect(names([])).toEqual([]);
    expect(names(["admin.users", "erp.submit"])).toEqual([]);
  });

  it("lists exactly the order statuses the API knows, so the model cannot invent one", () => {
    const search = toolsFor({ permissions: ["orders.view"] })[0];
    const status = (search?.parametros as { properties: { status: { enum: string[] } } }).properties
      .status;

    expect(status.enum).toEqual([...ORDER_STATUSES]);
  });

  it("has no tool that changes anything", () => {
    const all = toolsFor({
      permissions: ["orders.view", "dashboard.view", "orders.act", "erp.submit"],
    });

    expect(
      all.map((tool) => tool.nombre).every((name) => /^(search|get)_|_summary$/.test(name)),
    ).toBe(true);
  });
});
