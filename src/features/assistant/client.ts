import "server-only";
import type { AppLocale } from "@/i18n/config";
import type { ToolDefinition } from "./tools/definitions";
import { xiaErrorSchema, xiaStepSchema, type AssistantErrorCode, type XiaStep } from "./schemas";

/** A step can wait for the model to load from disk: this is a language model, not a database query. */
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

/** One message of the conversation as Xia wants it: the person, the assistant (maybe asking for tools), or a tool result. */
export type XiaWireMessage =
  | {
      rol: "user" | "assistant";
      texto: string;
      llamadas?: { nombre: string; argumentos: Record<string, unknown> }[];
    }
  | { rol: "tool"; herramienta: string; texto: string };

export type StepInput = {
  baseUrl: string;
  token: string;
  messages: readonly XiaWireMessage[];
  tools: readonly ToolDefinition[];
  /** Rules of this application that Xia adds to its own. Trusted: written here, never by the person. */
  instructions: string;
  locale: AppLocale;
};

/** Asks Xia for the next step. Throws `AssistantError` for anything that is not a well-formed step. */
export async function askXiaStep(input: StepInput): Promise<XiaStep> {
  let response: Response;
  try {
    response = await fetch(`${input.baseUrl}/v1/agente`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${input.token}` },
      body: JSON.stringify({
        mensajes: input.messages,
        herramientas: input.tools,
        instrucciones: input.instructions,
        idioma: input.locale,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new AssistantError("unavailable");
  }

  if (!response.ok) throw await failure(response);

  const parsed = xiaStepSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new AssistantError("unavailable");
  return parsed.data;
}
