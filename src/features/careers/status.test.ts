import { describe, expect, it } from "vitest";
import { APPLICATION_STATUSES } from "./schemas";
import { isFinal, nextActions, statusVariant } from "./status";

describe("nextActions", () => {
  it("never offers to send something that was not confirmed", () => {
    expect(nextActions("Draft")).toEqual(["confirm", "discard"]);
    expect(nextActions("Draft")).not.toContain("sent");
  });

  it("lets a confirmed application be sent or discarded", () => {
    expect(nextActions("Confirmed")).toEqual(["sent", "discard"]);
  });

  it("offers nothing once sent or discarded", () => {
    expect(nextActions("Sent")).toEqual([]);
    expect(nextActions("Discarded")).toEqual([]);
    expect(isFinal("Sent") && isFinal("Discarded") && !isFinal("Draft")).toBe(true);
  });

  it("has a badge for every status", () => {
    for (const status of APPLICATION_STATUSES) expect(statusVariant(status)).toBeTruthy();
  });
});
