import { describe, expect, it, vi } from "vitest";
import type { User } from "@/features/auth";
import { runAgent, type AgentInput } from "./agent";
import { AssistantError, type StepInput } from "./client";
import type { XiaStep } from "./schemas";
import type { ToolOutcome } from "./tools/executors";

const user = {
  id: "u1",
  email: "ana@stockline.test",
  displayName: "Ana",
  role: "Buyer",
  isAdmin: false,
  isActive: true,
  provider: "Local",
  permissions: ["orders.view", "dashboard.view"],
  createdAt: "2026-01-01T00:00:00Z",
} satisfies User;

const quota = { limite: 30, restantes: 28, renueva_en_segundos: 600, advertencia: false };
const answer = (
  respuesta: string,
  fuentes: { documento: string; titulo: string }[] = [],
): XiaStep => ({
  tipo: "respuesta",
  respuesta,
  fuentes,
  sin_contexto: false,
  cuota: quota,
});
const asks = (
  ...llamadas: { nombre: string; argumentos?: Record<string, unknown> }[]
): XiaStep => ({
  tipo: "llamadas",
  llamadas: llamadas.map((call, i) => ({ id: `c${i}`, argumentos: {}, ...call })),
  cuota: quota,
});

function setup(steps: XiaStep[], outcomes: Record<string, ToolOutcome> = {}) {
  const queue = [...steps];
  const seen: StepInput[] = [];
  const step = vi.fn(async (input: StepInput) => {
    seen.push({ ...input, messages: [...input.messages] });
    const next = queue.shift();
    if (!next) throw new Error("no more steps");
    return next;
  });
  const run = vi.fn(
    async (name: string) => outcomes[name] ?? { content: '{"ok":true}', references: [] },
  );
  const input: AgentInput = {
    baseUrl: "http://xia.test",
    token: "t",
    user,
    question: "What is waiting for me?",
    history: [],
    locale: "en",
    step,
    run,
  };
  return { input, step, run, seen };
}

describe("runAgent", () => {
  it("returns the answer straight away when no tool is needed", async () => {
    const { input, run } = setup([
      answer("Hello!", [{ documento: "d.md", titulo: "Getting started" }]),
    ]);

    const result = await runAgent(input);

    expect(result).toMatchObject({
      text: "Hello!",
      sources: [{ path: "d.md", title: "Getting started" }],
      tools: [],
      references: [],
      noAnswer: false,
      quota: { limit: 30, remaining: 28, renewsInSeconds: 600, warning: false },
    });
    expect(run).not.toHaveBeenCalled();
  });

  it("runs the requested tools with the person's identity and asks again with the results", async () => {
    const { input, run, seen } = setup(
      [asks({ nombre: "orders_summary" }), answer("You have 7 waiting.")],
      { orders_summary: { content: '{"awaitingMyAction":7}', references: [] } },
    );

    const result = await runAgent(input);

    expect(run).toHaveBeenCalledWith("orders_summary", {}, user);
    expect(seen[1]?.messages.slice(-2)).toEqual([
      { rol: "assistant", texto: "", llamadas: [{ nombre: "orders_summary", argumentos: {} }] },
      { rol: "tool", herramienta: "orders_summary", texto: '{"awaitingMyAction":7}' },
    ]);
    expect(result).toMatchObject({ text: "You have 7 waiting.", tools: ["orders_summary"] });
  });

  it("collects the orders the data was about, once each, as links", async () => {
    const { input } = setup(
      [asks({ nombre: "search_orders" }, { nombre: "get_order" }), answer("Here they are.")],
      {
        search_orders: {
          content: "{}",
          references: [
            { id: "a", code: "PO-1" },
            { id: "b", code: "PO-2" },
          ],
        },
        get_order: { content: "{}", references: [{ id: "a", code: "PO-1" }] },
      },
    );

    const result = await runAgent(input);

    expect(result.references).toEqual([
      { id: "a", code: "PO-1" },
      { id: "b", code: "PO-2" },
    ]);
    expect(result.tools).toEqual(["search_orders", "get_order"]);
  });

  it("sends only the tools the person may use, and tells the model their role but nothing else about them", async () => {
    const { input, seen } = setup([answer("ok")]);

    await runAgent({ ...input, user: { ...user, permissions: ["orders.view"] } });

    expect(seen[0]?.tools.map((tool) => tool.nombre)).toEqual(["search_orders", "get_order"]);
    expect(seen[0]?.instructions).toContain("role is Buyer");
    expect(seen[0]?.instructions).not.toContain("ana@stockline.test");
  });

  it("starts from the earlier turns and ends with the new question", async () => {
    const { input, seen } = setup([answer("The second is PO-2.")]);

    await runAgent({
      ...input,
      question: "And the second?",
      history: [
        { role: "user", text: "Show drafts" },
        { role: "assistant", text: "PO-1 and PO-2" },
      ],
    });

    expect(seen[0]?.messages).toEqual([
      { rol: "user", texto: "Show drafts" },
      { rol: "assistant", texto: "PO-1 and PO-2" },
      { rol: "user", texto: "And the second?" },
    ]);
  });

  it("runs at most four tools per round", async () => {
    const many = Array.from({ length: 7 }, () => ({ nombre: "orders_summary" }));
    const { input, run } = setup([asks(...many), answer("done")]);

    await runAgent(input);

    expect(run).toHaveBeenCalledTimes(4);
  });

  it("gives up when the model keeps asking for tools instead of answering", async () => {
    const { input, step } = setup(
      Array.from({ length: 10 }, () => asks({ nombre: "orders_summary" })),
    );

    await expect(runAgent(input)).rejects.toMatchObject({ code: "unavailable" });
    expect(step).toHaveBeenCalledTimes(4);
  });

  it("lets Xia's errors through unchanged", async () => {
    const { input } = setup([]);
    input.step = vi.fn().mockRejectedValue(new AssistantError("quotaExhausted", 900));

    await expect(runAgent(input)).rejects.toMatchObject({
      code: "quotaExhausted",
      retryAfterSeconds: 900,
    });
  });
});
