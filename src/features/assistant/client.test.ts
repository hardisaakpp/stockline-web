import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantError, askXia } from "./client";

const quota = { limite: 30, restantes: 29, renueva_en_segundos: 600, advertencia: false };
const input = {
  baseUrl: "http://xia.test",
  token: "t",
  question: "How do I import?",
  history: [],
  locale: "en",
} as const;

function reply(body: unknown, status = 200) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body, { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe("askXia", () => {
  it("sends the question, the history and the language with the user's token", async () => {
    reply({ respuesta: "Go to Orders.", fuentes: [], sin_contexto: false, cuota: quota });

    await askXia({ ...input, history: [{ role: "user", text: "hi" }], locale: "es" });

    const [url, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(url).toBe("http://xia.test/v1/preguntar");
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer t");
    expect(JSON.parse(String(init?.body))).toEqual({
      pregunta: "How do I import?",
      historial: [{ rol: "user", texto: "hi" }],
      idioma: "es",
    });
  });

  it("translates Xia's answer into the app's vocabulary", async () => {
    reply({
      respuesta: "Go to Orders.",
      fuentes: [{ area: "stockline", documento: "orders-import.md", titulo: "Importing an order" }],
      sin_contexto: false,
      cuota: { ...quota, restantes: 2, advertencia: true },
    });

    await expect(askXia(input)).resolves.toEqual({
      text: "Go to Orders.",
      sources: [{ path: "orders-import.md", title: "Importing an order" }],
      noAnswer: false,
      quota: { limit: 30, remaining: 2, renewsInSeconds: 600, warning: true },
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

    await expect(askXia(input)).rejects.toMatchObject({ code });
  });

  it("reports how long until the quota renews", async () => {
    reply({ error: "cuota-agotada", cuota: { ...quota, renueva_en_segundos: 900 } }, 429);

    await expect(askXia(input)).rejects.toMatchObject({ retryAfterSeconds: 900 });
  });

  it("treats an unreachable server or a malformed answer as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(askXia(input)).rejects.toBeInstanceOf(AssistantError);

    reply({ unexpected: true });
    await expect(askXia(input)).rejects.toMatchObject({ code: "unavailable" });
  });
});
