import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantError, askXiaStep } from "./client";

const quota = { limite: 30, restantes: 29, renueva_en_segundos: 600, advertencia: false };
const input = {
  baseUrl: "http://xia.test",
  token: "t",
  messages: [{ rol: "user", texto: "How do I import?" }],
  tools: [{ nombre: "get_order", descripcion: "Order", parametros: { type: "object" } }],
  instructions: "Be brief.",
  locale: "en",
} as const;

function reply(body: unknown, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body, { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe("askXiaStep", () => {
  it("sends the conversation, the tools, the application's rules and the language with the user's token", async () => {
    reply({
      tipo: "respuesta",
      respuesta: "Go to Orders.",
      fuentes: [],
      sin_contexto: false,
      cuota: quota,
    });

    await askXiaStep({ ...input, locale: "es" });

    const [url, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(url).toBe("http://xia.test/v1/agente");
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer t");
    expect(JSON.parse(String(init?.body))).toEqual({
      mensajes: input.messages,
      herramientas: input.tools,
      instrucciones: "Be brief.",
      idioma: "es",
    });
  });

  it("returns an answer step as Xia sent it", async () => {
    const body = {
      tipo: "respuesta",
      respuesta: "Go to Orders.",
      fuentes: [{ area: "stockline", documento: "orders-import.md", titulo: "Importing an order" }],
      sin_contexto: false,
      cuota: quota,
    };
    reply(body);

    await expect(askXiaStep(input)).resolves.toMatchObject({
      tipo: "respuesta",
      respuesta: "Go to Orders.",
      fuentes: [{ documento: "orders-import.md", titulo: "Importing an order" }],
    });
  });

  it("returns a tool-request step", async () => {
    reply({
      tipo: "llamadas",
      llamadas: [{ id: "call_1", nombre: "get_order", argumentos: { order_code: "PO-1" } }],
      cuota: quota,
    });

    await expect(askXiaStep(input)).resolves.toMatchObject({
      tipo: "llamadas",
      llamadas: [{ nombre: "get_order", argumentos: { order_code: "PO-1" } }],
    });
  });

  it.each([
    ["cuota-agotada", 429, "quotaExhausted"],
    ["demasiadas-peticiones", 429, "busy"],
    ["sin-modelo", 503, "busy"],
    ["sin-acceso", 403, "noAccess"],
    ["peticion-invalida", 400, "invalid"],
    ["error-interno", 500, "unavailable"],
    ["algo-nuevo", 418, "unavailable"],
  ])("maps the Xia error %s (HTTP %i) to %s", async (error, status, code) => {
    reply({ error, cuota: { ...quota, renueva_en_segundos: 900 } }, status);

    await expect(askXiaStep(input)).rejects.toMatchObject({ code });
  });

  it("reports how long until the quota renews", async () => {
    reply({ error: "cuota-agotada", cuota: { ...quota, renueva_en_segundos: 900 } }, 429);

    await expect(askXiaStep(input)).rejects.toMatchObject({ retryAfterSeconds: 900 });
  });

  it("treats an unreachable server or a malformed step as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(askXiaStep(input)).rejects.toBeInstanceOf(AssistantError);

    reply({ tipo: "otra-cosa" });
    await expect(askXiaStep(input)).rejects.toMatchObject({ code: "unavailable" });

    reply({ tipo: "llamadas", llamadas: [{ nombre: "x" }], cuota: quota });
    await expect(askXiaStep(input)).rejects.toMatchObject({ code: "unavailable" });
  });
});
