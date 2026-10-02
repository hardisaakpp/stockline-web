import "server-only";
import { env } from "@/lib/env";

/** Whether Xia is configured. When it is not, the interface simply does not offer the assistant. */
export const assistantEnabled = (): boolean => env.assistant !== null;
