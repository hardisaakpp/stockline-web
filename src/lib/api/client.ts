import type { z } from "zod";
import { env } from "../env";
import { ApiError } from "./problem";

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialized as JSON. */
  body?: unknown;
  /** A file sent as it is (instead of JSON), e.g. an uploaded CV. */
  file?: { bytes: ArrayBuffer; contentType: string };
  accessToken?: string;
  signal?: AbortSignal;
  /** Another service of the product (e.g. api-careers). Defaults to api-stockline. */
  baseUrl?: string;
};

/** The API answered successfully but not with the shape this client was built against. */
export class ApiContractError extends Error {
  constructor(path: string, detail: string) {
    super(`Unexpected response from ${path}: ${detail}`);
    this.name = "ApiContractError";
  }
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;
  if (options.file) headers["content-type"] = options.file.contentType;
  else if (options.body !== undefined) headers["content-type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${options.baseUrl ?? env.apiUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.file
        ? options.file.bytes
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "The service is unreachable. Try again in a moment.");
  }

  if (!response.ok) throw await ApiError.fromResponse(response);
  return response;
}

/** Calls api-stockline and validates the JSON answer against `schema`. */
export async function apiRequest<S extends z.ZodType>(
  path: string,
  schema: S,
  options: RequestOptions = {},
): Promise<z.infer<S>> {
  const response = await send(path, options);
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new ApiContractError(path, parsed.error.message);
  return parsed.data;
}

/** Calls the API for an endpoint that answers with a file (e.g. a PDF). */
export async function apiRequestBytes(
  path: string,
  options: RequestOptions = {},
): Promise<ArrayBuffer> {
  return (await send(path, { ...options })).arrayBuffer();
}

/** Calls api-stockline for an endpoint that answers with no body (204). */
export async function apiRequestVoid(path: string, options: RequestOptions = {}): Promise<void> {
  await send(path, options);
}
