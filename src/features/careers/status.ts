import type { ApplicationStatus } from "./schemas";

export type StatusAction = "confirm" | "sent" | "discard";

/**
 * What can happen next. The same rules api-careers enforces (this only decides which buttons to show):
 * nothing is "sent" without being confirmed, and sent or discarded are final.
 */
export function nextActions(status: ApplicationStatus): StatusAction[] {
  switch (status) {
    case "Draft":
      return ["confirm", "discard"];
    case "Confirmed":
      return ["sent", "discard"];
    default:
      return [];
  }
}

export const isFinal = (status: ApplicationStatus) => nextActions(status).length === 0;

/** Tone for a status badge. */
export function statusVariant(
  status: ApplicationStatus,
): "secondary" | "default" | "outline" | "destructive" {
  switch (status) {
    case "Draft":
      return "secondary";
    case "Confirmed":
      return "outline";
    case "Sent":
      return "default";
    default:
      return "destructive";
  }
}
