import type { Answer, AssistantErrorCode, ChatTurn } from "./schemas";

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; answer: Answer }
  | {
      id: string;
      role: "error";
      code: AssistantErrorCode;
      retryAfterSeconds?: number;
      /** The question that failed, so "try again" can ask it once more. */
      question: string;
    };

let counter = 0;
export const newMessageId = () => `m${++counter}`;

/**
 * The conversation Xia should remember. A question that was never answered (it failed) is left out,
 * so a retry does not confuse the model with a question it never saw.
 */
export function buildHistory(messages: readonly ChatMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  messages.forEach((message, index) => {
    if (message.role === "assistant") turns.push({ role: "assistant", text: message.answer.text });
    if (message.role === "user" && messages[index + 1]?.role === "assistant") {
      turns.push({ role: "user", text: message.text });
    }
  });
  return turns;
}

/** Takes a failed question out of the conversation (the error and the question before it) to ask it again. */
export function withoutFailedQuestion(
  messages: readonly ChatMessage[],
  errorId: string,
): ChatMessage[] {
  const at = messages.findIndex((message) => message.id === errorId);
  if (at < 1) return [...messages];
  return messages.filter((_, index) => index !== at && index !== at - 1);
}
