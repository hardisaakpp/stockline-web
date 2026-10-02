import "server-only";
import type { z } from "zod";
import { requireAccessToken } from "@/features/auth/server";
import { userSchema } from "@/features/auth";
import { apiRequest, apiRequestVoid } from "@/lib/api/client";
import {
  locationSchema,
  locationsSchema,
  previewSchema,
  rolesSchema,
  subscriptionSchema,
  subscriptionsSchema,
  topicsSchema,
  usersSchema,
} from "./schemas";

type Options = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown };

async function authed<S extends z.ZodType>(path: string, schema: S, options: Options = {}) {
  return apiRequest(path, schema, { ...options, accessToken: await requireAccessToken() });
}

async function authedVoid(path: string, options: Options = {}) {
  await apiRequestVoid(path, { ...options, accessToken: await requireAccessToken() });
}

const enc = encodeURIComponent;

export const adminApi = {
  users: () => authed("/admin/users", usersSchema),
  roles: () => authed("/admin/roles", rolesSchema),
  createUser: (body: {
    email: string;
    displayName: string;
    password: string;
    role: string;
    isAdmin: boolean;
  }) => authed("/admin/users", userSchema, { method: "POST", body }),
  updateUser: (
    id: string,
    body: { displayName: string; role: string; isAdmin: boolean; isActive: boolean },
  ) => authed(`/admin/users/${enc(id)}`, userSchema, { method: "PATCH", body }),
  resetPassword: (id: string, newPassword: string) =>
    authedVoid(`/admin/users/${enc(id)}/reset-password`, { method: "POST", body: { newPassword } }),

  locations: () => authed("/admin/locations", locationsSchema),
  createLocation: (body: {
    code: string;
    name: string;
    kind: string;
    supplyingWarehouseCode: string | null;
    isActive: boolean;
  }) => authed("/admin/locations", locationSchema, { method: "POST", body }),
  updateLocation: (
    code: string,
    body: { name: string; supplyingWarehouseCode: string | null; isActive: boolean },
  ) => authed(`/admin/locations/${enc(code)}`, locationSchema, { method: "PATCH", body }),

  topics: () => authed("/admin/notifications/topics", topicsSchema),
  subscriptions: () => authed("/admin/notifications/subscriptions", subscriptionsSchema),
  subscribe: (body: { email: string; topic: string }) =>
    authed("/admin/notifications/subscriptions", subscriptionSchema, { method: "POST", body }),
  unsubscribe: (id: string) =>
    authedVoid(`/admin/notifications/subscriptions/${enc(id)}`, { method: "DELETE" }),
  preview: (topic: string) =>
    authed(`/admin/notifications/topics/${enc(topic)}/preview`, previewSchema),
};
