import "server-only";
import type { AppLocale } from "@/i18n/config";
import { toXiaHistory } from "./history";
import {
  xiaAnswerSchema,
  xiaErrorSchema,
  type Answer,
  type AssistantErrorCode,
  type ChatTurn,
} from "./schemas";

/** A question can wait for the model to load from disk: this is a language model, not a database query. */
const TIMEOUT_MS = 120_000;

export class AssistantError extends Error {
  constructor(
    readonly code: AssistantErrorCode,
    readonly retryAfterSeconds?: number,
  ) {
    super(`Assistant error: ${code}`);
    this.name = "AssistantError";
  }
}

/** Xia's own error codes, mapped to the few outcomes the interface distinguishes. */
const CODE_BY_XIA_ERROR: Record<string, AssistantErrorCode> = {
  "cuota-agotada": "quotaExhausted",
  "demasiadas-peticiones": "busy",
  "sin-modelo": "busy",
  "sin-acceso": "noAccess",
  "area-no-permitida": "noAccess",
  "peticion-invalida": "invalid",
};

async function failure(response: Response): Promise<AssistantError> {
  const body = xiaErrorSchema.safeParse(await response.json().catch(() => null));
  if (!body.success) return new AssistantError("unavailable");
  const code = CODE_BY_XIA_ERROR[body.data.error] ?? "unavailable";
  return new AssistantError(
    code,
    body.data.cuota?.renueva_en_segundos ?? body.data.reintentar_en_segundos,
  );
}

export type AskInput = {
  baseUrl: string;
  token: string;
  question: string;
  history: readonly ChatTurn[];
  locale: AppLocale;
};

/** Asks Xia one question. Throws `AssistantError` for anything that is not an answer. */
export async function askXia({
  baseUrl,
  token,
  question,
  history,
  locale,
}: AskInput): Promise<Answer> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/preguntar`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        pregunta: question,
        historial: toXiaHistory(history),
        idioma: locale,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new AssistantError("unavailable");
  }

  if (!response.ok) throw await failure(response);

  const parsed = xiaAnswerSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new AssistantError("unavailable");

  const { respuesta, fuentes, sin_contexto, cuota } = parsed.data;
  return {
    text: respuesta,
    sources: fuentes.map((source) => ({ path: source.documento, title: source.titulo })),
    noAnswer: sin_contexto,
    quota: {
      limit: cuota.limite,
      remaining: cuota.restantes,
      renewsInSeconds: cuota.renueva_en_segundos,
      warning: cuota.advertencia,
    },
  };
}
