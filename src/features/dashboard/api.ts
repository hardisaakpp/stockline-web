import "server-only";
import { requireAccessToken } from "@/features/auth/server";
import { apiRequest } from "@/lib/api/client";
import { dashboardSchema } from "./schemas";

export const dashboardApi = {
  summary: async () =>
    apiRequest("/dashboard/summary", dashboardSchema, { accessToken: await requireAccessToken() }),
};
