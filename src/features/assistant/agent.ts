import "server-only";
import type { User } from "@/features/auth";
import type { AppLocale } from "@/i18n/config";
import { askXiaStep, AssistantError, type XiaWireMessage } from "./client";
import { toXiaMessages } from "./history";
import type { Answer, ChatTurn, OrderReference, Quota, XiaStep } from "./schemas";
import { toolsFor } from "./tools/definitions";
import { executeTool, type Reference } from "./tools/executors";

/** Rounds of "ask for tools, run them, ask again" before giving up: a model that keeps asking is stuck. */
const MAX_STEPS = 4;
const MAX_CALLS_PER_STEP = 4;
const MAX_REFERENCES = 6;

export type AgentInput = {
  baseUrl: string;
  token: string;
  user: User;
  question: string;
  history: readonly ChatTurn[];
  locale: AppLocale;
  /** Injected so tests can run the loop without a network. */
  step?: typeof askXiaStep;
  run?: typeof executeTool;
};

/** Rules specific to this application. Role is the only thing about the person that the model is told. */
const instructionsFor = (user: User) =>
  `You are inside Stockline, a purchase-order system. The user's role is ${user.role}. ` +
  "Order codes look like PO-2026-001. The tools only show what this user is allowed to see: " +
  "if an order does not appear, they may not have access to it or it may not exist. " +
  "Mention order codes exactly as the tools return them. Be brief.";

const quotaOf = (step: XiaStep): Quota => ({
  limit: step.cuota.limite,
  remaining: step.cuota.restantes,
  renewsInSeconds: step.cuota.renueva_en_segundos,
  warning: step.cuota.advertencia,
});

function uniqueReferences(found: readonly Reference[]): OrderReference[] {
  const byId = new Map(found.map((reference) => [reference.id, reference]));
  return [...byId.values()].slice(0, MAX_REFERENCES);
}

/**
 * Runs the conversation turn: Xia decides, this server runs the tools it asks for (read-only, with the person's own
 * session), and Xia is asked again until it answers. The model never receives credentials and never runs anything itself.
 */
export async function runAgent(input: AgentInput): Promise<Answer> {
  const step = input.step ?? askXiaStep;
  const run = input.run ?? executeTool;
  const tools = toolsFor(input.user);
  const messages: XiaWireMessage[] = [
    ...toXiaMessages(input.history),
    { rol: "user", texto: input.question },
  ];
  const used = new Set<string>();
  const references: Reference[] = [];

  for (let round = 0; round < MAX_STEPS; round++) {
    const next = await step({
      baseUrl: input.baseUrl,
      token: input.token,
      messages,
      tools,
      instructions: instructionsFor(input.user),
      locale: input.locale,
    });

    if (next.tipo === "respuesta") {
      return {
        text: next.respuesta,
        sources: next.fuentes.map((source) => ({ path: source.documento, title: source.titulo })),
        tools: [...used],
        references: uniqueReferences(references),
        noAnswer: next.sin_contexto,
        quota: quotaOf(next),
      };
    }

    const calls = next.llamadas.slice(0, MAX_CALLS_PER_STEP);
    messages.push({
      rol: "assistant",
      texto: "",
      llamadas: calls.map((call) => ({ nombre: call.nombre, argumentos: call.argumentos })),
    });
    const results = await Promise.all(
      calls.map((call) => run(call.nombre, call.argumentos, input.user)),
    );
    calls.forEach((call, index) => {
      used.add(call.nombre);
      references.push(...(results[index]?.references ?? []));
      messages.push({
        rol: "tool",
        herramienta: call.nombre,
        texto: results[index]?.content ?? "{}",
      });
    });
  }

  throw new AssistantError("unavailable");
}
