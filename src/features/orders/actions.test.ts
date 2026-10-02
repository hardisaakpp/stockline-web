import { describe, expect, it } from "vitest";
import { visibleActions } from "./actions";

describe("visibleActions", () => {
  it("hides actions reserved for the system", () => {
    const shown = visibleActions([
      "MarkSent",
      "MarkLogisticsPending",
      "MarkErpSubmissionFailed",
      "Complete",
    ]);

    expect(shown.map((a) => a.action)).toEqual(["Complete"]);
  });

  it("puts forward steps before destructive ones", () => {
    const shown = visibleActions(["Cancel", "Submit"]);

    expect(shown.map((a) => a.action)).toEqual(["Submit", "Cancel"]);
  });

  it("asks for confirmation on every destructive action", () => {
    for (const { action, meta } of visibleActions(["Cancel", "Reject", "CancelBySupplier"])) {
      expect(meta.confirm, action).toBe(true);
      expect(meta.tone, action).toBe("destructive");
    }
  });

  it("routes the two actions that need more input to their own flows", () => {
    const byAction = Object.fromEntries(
      visibleActions(["ConfirmBySupplier", "ConfirmRedistribution"]).map((a) => [
        a.action,
        a.meta.kind,
      ]),
    );

    expect(byAction).toEqual({
      ConfirmBySupplier: "confirmBySupplier",
      ConfirmRedistribution: "redistribute",
    });
  });
});
