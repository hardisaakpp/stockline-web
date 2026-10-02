import { describe, expect, it } from "vitest";
import { hasActiveFilters, parseListParams, toApiQuery, toSearchParams } from "./list-params";

describe("parseListParams", () => {
  it("defaults to the newest orders first", () => {
    expect(parseListParams({})).toEqual({
      q: undefined,
      status: undefined,
      mine: false,
      pending: false,
      from: undefined,
      to: undefined,
      page: 1,
      sort: "orderDate",
      desc: true,
    });
  });

  it("reads filters, sorting and paging", () => {
    const params = parseListParams({
      q: "  PO-1 ",
      status: "Draft",
      mine: "1",
      pending: "1",
      from: "2026-10-01",
      to: "2026-10-31",
      page: "3",
      sort: "+code",
    });

    expect(params).toMatchObject({
      q: "PO-1",
      status: "Draft",
      mine: true,
      pending: true,
      from: "2026-10-01",
      to: "2026-10-31",
      page: 3,
      sort: "code",
      desc: false,
    });
  });

  it("ignores malformed values instead of failing", () => {
    const params = parseListParams({
      status: "Nonsense",
      from: "yesterday",
      to: "2026-13",
      page: "-4",
      sort: "bogus",
      mine: "yes",
    });

    expect(params).toMatchObject({
      status: undefined,
      from: undefined,
      to: undefined,
      page: 1,
      sort: "orderDate",
      mine: false,
    });
  });

  it("uses the first value when a param is repeated", () => {
    expect(parseListParams({ status: ["Sent", "Draft"], page: ["2", "5"] })).toMatchObject({
      status: "Sent",
      page: 2,
    });
  });

  it("sorts other fields descending only when asked", () => {
    expect(parseListParams({ sort: "-code" })).toMatchObject({ sort: "code", desc: true });
    expect(parseListParams({ sort: "+status" })).toMatchObject({ sort: "status", desc: false });
    expect(parseListParams({ sort: "code" })).toMatchObject({ sort: "code", desc: false });
    expect(parseListParams({ sort: "bogus" })).toMatchObject({ sort: "orderDate", desc: true });
  });
});

describe("toSearchParams", () => {
  it("omits defaults so URLs stay clean", () => {
    expect(toSearchParams({ page: 1, sort: "orderDate", desc: true }).toString()).toBe("");
  });

  it("round-trips through parseListParams", () => {
    const original = parseListParams({
      q: "abc",
      status: "Sent",
      page: "2",
      sort: "+code",
      from: "2026-10-01",
      pending: "1",
    });

    const roundTripped = parseListParams(Object.fromEntries(toSearchParams(original)));

    expect(roundTripped).toEqual(original);
  });

  it("keeps an ascending date sort", () => {
    expect(toSearchParams({ sort: "orderDate", desc: false }).get("sort")).toBe("+orderDate");
  });
});

describe("toApiQuery", () => {
  it("maps filters to api-stockline parameters", () => {
    const query = new URLSearchParams(
      toApiQuery(
        parseListParams({
          q: "x",
          status: "Draft",
          from: "2026-10-01",
          to: "2026-10-02",
          pending: "1",
          mine: "1",
          sort: "-code",
        }),
        "user-1",
      ),
    );

    expect(Object.fromEntries(query)).toEqual({
      page: "1",
      pageSize: "20",
      sort: "-code",
      search: "x",
      status: "Draft",
      dateFrom: "2026-10-01",
      dateTo: "2026-10-02",
      pendingMyAction: "true",
      createdBy: "user-1",
    });
  });
});

describe("hasActiveFilters", () => {
  it("ignores sorting and paging", () => {
    expect(hasActiveFilters(parseListParams({ page: "2", sort: "+code" }))).toBe(false);
    expect(hasActiveFilters(parseListParams({ q: "a" }))).toBe(true);
  });
});
