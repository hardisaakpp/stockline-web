import { describe, expect, it } from "vitest";
import { buildHistory, withoutFailedQuestion, type ChatMessage } from "./chat-state";

const answer = (text: string): ChatMessage => ({
  id: `a-${text}`,
  role: "assistant",
  answer: {
    text,
    sources: [],
    noAnswer: false,
    quota: { limit: 30, remaining: 29, renewsInSeconds: 100, warning: false },
  },
});
const user = (text: string): ChatMessage => ({ id: `u-${text}`, role: "user", text });
const error = (question: string): ChatMessage => ({
  id: `e-${question}`,
  role: "error",
  code: "busy",
  question,
});

describe("buildHistory", () => {
  it("lists answered exchanges in order", () => {
    expect(buildHistory([user("a"), answer("A"), user("b"), answer("B")])).toEqual([
      { role: "user", text: "a" },
      { role: "assistant", text: "A" },
      { role: "user", text: "b" },
      { role: "assistant", text: "B" },
    ]);
  });

  it("leaves out a question that failed, with its error", () => {
    expect(buildHistory([user("a"), answer("A"), user("b"), error("b")])).toEqual([
      { role: "user", text: "a" },
      { role: "assistant", text: "A" },
    ]);
  });
});

describe("withoutFailedQuestion", () => {
  it("removes the error and the question it belongs to", () => {
    const messages = [user("a"), answer("A"), user("b"), error("b")];
    expect(withoutFailedQuestion(messages, "e-b").map((m) => m.id)).toEqual(["u-a", "a-A"]);
  });

  it("changes nothing for an unknown id", () => {
    const messages = [user("a"), answer("A")];
    expect(withoutFailedQuestion(messages, "nope")).toEqual(messages);
  });
});
