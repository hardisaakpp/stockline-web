import type { OrderDifference } from "./schemas";

/** Same tolerance api-stockline uses when checking that child orders cover the missing units. */
export const SPLIT_TOLERANCE = 0.001;

export type ChildDraft = {
  /** Stable key for React lists; never sent to the API. */
  key: string;
  deliveryDate: string;
  /** Units of each product, as typed (empty string means none). */
  portions: Record<string, string>;
};

export type DifferenceLine = OrderDifference["lines"][number];

const toNumber = (text: string | undefined) => {
  const value = Number(text);
  return text && Number.isFinite(value) && value > 0 ? value : 0;
};

/** Units of each missing product still unassigned (negative when over-assigned). */
export function remainingByProduct(
  lines: readonly DifferenceLine[],
  children: readonly ChildDraft[],
) {
  return Object.fromEntries(
    lines.map((line) => {
      const assigned = children.reduce(
        (sum, child) => sum + toNumber(child.portions[line.productCode]),
        0,
      );
      return [line.productCode, round(line.difference - assigned)];
    }),
  );
}

export type SplitProblem = "noChildren" | "missingDate" | "emptyChild" | "unbalanced";

/** First reason the split cannot be submitted yet, or null when it covers exactly the missing units. */
export function splitProblem(
  lines: readonly DifferenceLine[],
  children: readonly ChildDraft[],
): SplitProblem | null {
  if (children.length === 0) return "noChildren";
  if (children.some((child) => !child.deliveryDate)) return "missingDate";
  if (
    children.some((child) =>
      lines.every((line) => toNumber(child.portions[line.productCode]) === 0),
    )
  )
    return "emptyChild";
  const remaining = remainingByProduct(lines, children);
  return Object.values(remaining).every((value) => Math.abs(value) <= SPLIT_TOLERANCE)
    ? null
    : "unbalanced";
}

/** Request body for `POST /orders/{id}/confirm`. Units left at zero are omitted. */
export function toConfirmBody(mode: "acknowledge" | "split", children: readonly ChildDraft[]) {
  if (mode === "acknowledge") return { acknowledgeDifference: true, children: [] };
  return {
    acknowledgeDifference: false,
    children: children.map((child) => ({
      deliveryDate: child.deliveryDate,
      portions: Object.fromEntries(
        Object.entries(child.portions)
          .map(([code, text]) => [code, toNumber(text)] as const)
          .filter(([, units]) => units > 0),
      ),
    })),
  };
}

/** Child order that takes all the missing units, a sensible starting point for the split. */
export function suggestedChild(
  lines: readonly DifferenceLine[],
  key: string,
  deliveryDate = "",
): ChildDraft {
  return {
    key,
    deliveryDate,
    portions: Object.fromEntries(
      lines.map((line) => [line.productCode, String(round(line.difference))]),
    ),
  };
}

// `+ 0` turns -0 (a rounding artefact) into 0.
const round = (value: number) => Math.round(value * 10_000) / 10_000 + 0;
