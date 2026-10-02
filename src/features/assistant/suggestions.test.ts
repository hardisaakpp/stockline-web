import { describe, expect, it } from "vitest";
import { suggestionsFor } from "./suggestions";

describe("suggestionsFor", () => {
  it("offers only questions the person could use the answer for", () => {
    expect(suggestionsFor(["orders.view"])).toEqual(["pending", "statuses"]);
    expect(suggestionsFor(["orders.view", "orders.import", "erp.submit"])).toEqual([
      "pending",
      "statuses",
      "importOrder",
      "erpRetry",
    ]);
  });

  it("includes administration questions for administrators", () => {
    expect(suggestionsFor(["admin.users"])).toEqual(["resetPassword"]);
  });

  it("caps the list and offers nothing without permissions", () => {
    const everything = [
      "orders.view",
      "orders.import",
      "orders.act",
      "erp.submit",
      "dashboard.view",
      "admin.users",
    ];
    expect(suggestionsFor(everything)).toHaveLength(4);
    expect(suggestionsFor(everything, 6)).toHaveLength(6);
    expect(suggestionsFor([])).toEqual([]);
  });
});
