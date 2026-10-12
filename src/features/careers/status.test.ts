import { describe, expect, it } from "vitest";
import { APPLICATION_STATUSES } from "./schemas";
import { isEditable, isFinal, nextActions, statusVariant } from "./status";

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
    expect(isFinal("Sent") && !isFinal("Discarded") && !isFinal("Draft")).toBe(true);
  });

  it("has a badge for every status", () => {
    for (const status of APPLICATION_STATUSES) expect(statusVariant(status)).toBeTruthy();
  });
});

describe("reopening", () => {
  it("a discarded application can only be reopened, and a sent one cannot", () => {
    expect(nextActions("Discarded")).toEqual(["reopen"]);
    expect(nextActions("Sent")).not.toContain("reopen");
  });

  it("only draft and confirmed applications have an editable letter", () => {
    expect(["Draft", "Confirmed", "Sent", "Discarded"].map((s) => isEditable(s as never))).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});
