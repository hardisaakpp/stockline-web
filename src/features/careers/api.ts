import "server-only";
import type { z } from "zod";
import { requireAccessToken } from "@/features/auth/server";
import { apiRequest, apiRequestBytes, apiRequestVoid } from "@/lib/api/client";
import { ApiError } from "@/lib/api/problem";
import { env } from "@/lib/env";
import {
  applicationDetailSchema,
  applicationListSchema,
  createdSchema,
  cvResponseSchema,
  importResultSchema,
  offersSchema,
  preferencesSchema,
  refreshSchema,
  statusResultSchema,
  type Cv,
  type Preferences,
} from "./schemas";

type Options = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  file?: { bytes: ArrayBuffer; contentType: string };
};

function baseUrl(): string {
  if (!env.careersApiUrl) throw new ApiError(503, "The Careers module is not configured.");
  return env.careersApiUrl;
}

/** The signed-in person's own token: api-careers accepts the ones api-stockline issues and filters everything by them. */
async function authed<S extends z.ZodType>(path: string, schema: S, options: Options = {}) {
  return apiRequest(path, schema, {
    ...options,
    accessToken: await requireAccessToken(),
    baseUrl: baseUrl(),
  });
}

async function authedVoid(path: string, options: Options = {}) {
  await apiRequestVoid(path, {
    ...options,
    accessToken: await requireAccessToken(),
    baseUrl: baseUrl(),
  });
}

async function authedBytes(path: string, options: Options = {}) {
  return apiRequestBytes(path, {
    ...options,
    accessToken: await requireAccessToken(),
    baseUrl: baseUrl(),
  });
}

export const careersApi = {
  cv: () => authed("/cv", cvResponseSchema),
  saveCv: (cv: Cv) => authedVoid("/cv", { method: "PUT", body: cv }),
  /** PDF of the draft being edited (nothing is stored) or, without one, of the saved CV. */
  cvPdf: (draft?: Cv) => authedBytes("/cv/pdf", { method: "POST", body: draft }),

  /** Reads a CV file (PDF, DOCX or a LinkedIn export) into a draft for the form: nothing is stored. */
  importCv: (bytes: ArrayBuffer) =>
    authed("/cv/import", importResultSchema, {
      method: "POST",
      file: { bytes, contentType: "application/octet-stream" },
    }),

  preferences: () => authed("/preferences", preferencesSchema),
  savePreferences: (preferences: Preferences) =>
    authedVoid("/preferences", { method: "PUT", body: preferences }),

  offers: (limit = 30) => authed(`/offers?limit=${limit}`, offersSchema),
  refreshOffers: (force = false) =>
    authed(`/offers/refresh?force=${force}`, refreshSchema, { method: "POST" }),

  prepareApplication: (offerId: string) =>
    authed("/applications", createdSchema, { method: "POST", body: { offerId } }),
  applications: () => authed("/applications", applicationListSchema),
  application: (id: string) =>
    authed(`/applications/${encodeURIComponent(id)}`, applicationDetailSchema),
  editLetter: (id: string, coverLetter: string) =>
    authedVoid(`/applications/${encodeURIComponent(id)}/letter`, {
      method: "PUT",
      body: { coverLetter },
    }),
  act: (id: string, action: "confirm" | "sent" | "discard") =>
    authed(`/applications/${encodeURIComponent(id)}/${action}`, statusResultSchema, {
      method: "POST",
    }),
  applicationPdf: (id: string) => authedBytes(`/applications/${encodeURIComponent(id)}/cv.pdf`),
};
