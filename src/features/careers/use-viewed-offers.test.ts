import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useViewedOffers } from "./use-viewed-offers";

beforeEach(() => window.localStorage.clear());

describe("useViewedOffers", () => {
  it("remembers an opened offer, across reloads, and can take it back", () => {
    const first = renderHook(() => useViewedOffers("u1"));
    expect(first.result.current.isViewed("a")).toBe(false);

    act(() => first.result.current.mark("a"));
    expect(first.result.current.isViewed("a")).toBe(true);

    first.unmount(); // a reload: a fresh hook reads what was stored
    const again = renderHook(() => useViewedOffers("u1"));
    expect(again.result.current.isViewed("a")).toBe(true);

    act(() => again.result.current.unmark("a"));
    expect(again.result.current.isViewed("a")).toBe(false);
  });

  it("each person has their own list", () => {
    const ana = renderHook(() => useViewedOffers("ana"));
    act(() => ana.result.current.mark("a"));
    const luis = renderHook(() => useViewedOffers("luis"));
    expect(luis.result.current.isViewed("a")).toBe(false);
  });
});
