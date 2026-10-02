import { describe, expect, it } from "vitest";
import { MAX_HISTORY_TURNS, toXiaMessages } from "./history";

describe("toXiaMessages", () => {
  it("keeps roles and order in Xia's message shape", () => {
    expect(
      toXiaMessages([
        { role: "user", text: "How do I import?" },
        { role: "assistant", text: "Go to Orders." },
      ]),
    ).toEqual([
      { rol: "user", texto: "How do I import?" },
      { rol: "assistant", texto: "Go to Orders." },
    ]);
  });

  it("keeps only the most recent turns Xia accepts", () => {
    const turns = Array.from({ length: 14 }, (_, i) => ({ role: "user" as const, text: `q${i}` }));
    const result = toXiaMessages(turns);

    expect(result).toHaveLength(MAX_HISTORY_TURNS);
    expect(result[0]?.texto).toBe("q4");
    expect(result.at(-1)?.texto).toBe("q13");
  });

  it("drops empty turns and truncates very long ones", () => {
    const result = toXiaMessages([
      { role: "user", text: "   " },
      { role: "assistant", text: "x".repeat(5000) },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.texto).toHaveLength(4000);
  });
});
