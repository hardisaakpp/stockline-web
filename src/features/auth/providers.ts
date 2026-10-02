import "server-only";
import { z } from "zod";
import { apiRequest } from "@/lib/api/client";

const providersSchema = z.object({ directory: z.boolean() });

/**
 * Which ways of signing in the API offers. If it cannot be asked, only the local account is offered:
 * the sign-in page must still render when the API is down.
 */
export async function getAuthProviders(): Promise<{ directory: boolean }> {
  try {
    return await apiRequest("/auth/providers", providersSchema);
  } catch {
    return { directory: false };
  }
}
