import type { ApplicationStatus } from "./schemas";

export type StatusAction = "confirm" | "sent" | "discard" | "reopen";

/**
 * What can happen next. The same rules api-careers enforces (this only decides which buttons to show):
 * nothing is "sent" without being confirmed, a discarded one can be reopened as a draft, and sent is final.
 */
export function nextActions(status: ApplicationStatus): StatusAction[] {
  switch (status) {
    case "Draft":
      return ["confirm", "discard"];
    case "Confirmed":
      return ["sent", "discard"];
    case "Discarded":
      return ["reopen"];
    default:
      return [];
  }
}

export const isFinal = (status: ApplicationStatus) => nextActions(status).length === 0;

/** Only a draft or a confirmed application can have its letter edited. */
export const isEditable = (status: ApplicationStatus) =>
  status === "Draft" || status === "Confirmed";

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
