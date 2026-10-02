"use client";

import { useCallback, useState } from "react";
import { askAssistant } from "./actions.server";
import { buildHistory, newMessageId, withoutFailedQuestion, type ChatMessage } from "./chat-state";
import type { AskResult, Quota } from "./schemas";

/** State of one conversation with Xia. It lives above the sheet so closing the panel does not forget it. */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);

  const ask = useCallback(
    async (rawQuestion: string, base: readonly ChatMessage[]) => {
      const question = rawQuestion.trim();
      if (!question || pending) return;

      const history = buildHistory(base);
      setMessages([...base, { id: newMessageId(), role: "user", text: question }]);
      setPending(true);

      let result: AskResult;
      try {
        result = await askAssistant({ question, history });
      } catch {
        result = { ok: false, code: "unavailable" };
      }

      setPending(false);
      if (result.ok) {
        setQuota(result.answer.quota);
        setMessages((current) => [
          ...current,
          { id: newMessageId(), role: "assistant", answer: result.answer },
        ]);
      } else {
        setMessages((current) => [
          ...current,
          {
            id: newMessageId(),
            role: "error",
            code: result.code,
            retryAfterSeconds: result.retryAfterSeconds,
            question,
          },
        ]);
      }
    },
    [pending],
  );

  const send = useCallback((question: string) => ask(question, messages), [ask, messages]);

  const retry = useCallback(
    (errorId: string, question: string) => ask(question, withoutFailedQuestion(messages, errorId)),
    [ask, messages],
  );

  const reset = useCallback(() => {
    if (!pending) setMessages([]);
  }, [pending]);

  return { messages, pending, quota, send, retry, reset };
}
