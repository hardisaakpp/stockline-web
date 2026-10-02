import { z } from "zod";

/** What Xia sends back for a question (its contract is in Spanish; the rest of the app uses these English names). */
export const xiaQuotaSchema = z.object({
  limite: z.number(),
  restantes: z.number(),
  renueva_en_segundos: z.number(),
  advertencia: z.boolean(),
});

export const xiaAnswerSchema = z.object({
  respuesta: z.string(),
  fuentes: z.array(z.object({ documento: z.string(), titulo: z.string() })),
  sin_contexto: z.boolean(),
  cuota: xiaQuotaSchema,
});

/** The error body Xia uses for every failure: callers decide by `error`, not by the HTTP status. */
export const xiaErrorSchema = z.object({
  error: z.string(),
  cuota: xiaQuotaSchema.optional(),
  reintentar_en_segundos: z.number().optional(),
});

export type Quota = {
  limit: number;
  remaining: number;
  renewsInSeconds: number;
  /** Ten percent or less is left: the person should be warned, not surprised. */
  warning: boolean;
};

export type Source = { path: string; title: string };

export type Answer = {
  text: string;
  sources: Source[];
  /** The documentation does not cover the question. Not an error: the text is Xia's polite refusal. */
  noAnswer: boolean;
  quota: Quota;
};

/** Why a question could not be answered, in terms the interface translates (`assistant.errors.<code>`). */
export const ASSISTANT_ERROR_CODES = [
  "notConfigured",
  "unauthorized",
  "quotaExhausted",
  "busy",
  "noAccess",
  "invalid",
  "unavailable",
] as const;
export type AssistantErrorCode = (typeof ASSISTANT_ERROR_CODES)[number];

export type AskResult =
  | { ok: true; answer: Answer }
  | { ok: false; code: AssistantErrorCode; retryAfterSeconds?: number };

export type ChatTurn = { role: "user" | "assistant"; text: string };

/** Input of the ask action, also validated on the server because Server Actions are public endpoints. */
export const askInputSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(4000) }))
    .max(40),
});
