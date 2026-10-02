import type { OrderAction } from "./schemas";

export type ActionKind =
  /** Applied with a single call to `/actions/{action}`. */
  | "simple"
  /** Needs the production-difference dialog (acknowledge or split into child orders). */
  | "confirmBySupplier"
  /** Needs a distribution plan: handled in the redistribution tab. */
  | "redistribute";

export type ActionMeta = {
  kind: ActionKind;
  /** Primary actions move the order forward; destructive ones close it. */
  tone: "primary" | "neutral" | "destructive";
  /** Ask for confirmation first because the step cannot be undone. */
  confirm: boolean;
};

/** Presentation of the actions a user can trigger. System-only actions are never offered. */
export const ACTION_META = {
  Submit: { kind: "simple", tone: "primary", confirm: true },
  Open: { kind: "simple", tone: "primary", confirm: false },
  ConfirmProduction: { kind: "simple", tone: "primary", confirm: true },
  ConfirmBySupplier: { kind: "confirmBySupplier", tone: "primary", confirm: false },
  AcceptPostponed: { kind: "simple", tone: "primary", confirm: true },
  ConfirmRedistribution: { kind: "redistribute", tone: "primary", confirm: false },
  MarkDispatchAndInvoice: { kind: "simple", tone: "primary", confirm: true },
  Complete: { kind: "simple", tone: "primary", confirm: true },
  CancelBySupplier: { kind: "simple", tone: "destructive", confirm: true },
  Reject: { kind: "simple", tone: "destructive", confirm: true },
  Cancel: { kind: "simple", tone: "destructive", confirm: true },
} as const satisfies Partial<Record<OrderAction, ActionMeta>>;

/** Actions a person can trigger from the interface. */
export type UserAction = keyof typeof ACTION_META;

/** The subset that asks for confirmation first (they have a title and body in the message catalog). */
export type ConfirmAction = {
  [K in UserAction]: (typeof ACTION_META)[K]["confirm"] extends true ? K : never;
}[UserAction];

export const isUserAction = (action: OrderAction): action is UserAction => action in ACTION_META;

/** Actions to show for an order, in presentation order: forward steps first, then destructive ones. */
export function visibleActions(
  available: readonly OrderAction[],
): { action: UserAction; meta: ActionMeta }[] {
  const rank = { primary: 0, neutral: 1, destructive: 2 } as const;
  return available
    .filter(isUserAction)
    .map((action) => ({ action, meta: ACTION_META[action] as ActionMeta }))
    .sort((a, b) => rank[a.meta.tone] - rank[b.meta.tone]);
}
