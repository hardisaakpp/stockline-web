import type { OrderLocation, Plan, Redistribution } from "./schemas";

/** Same tolerance api-stockline uses when checking that a distribution adds up to the confirmed quantity. */
export const TOTAL_TOLERANCE = 0.001;

/** Typed quantities by product and location (strings, so partial input like "1." survives while typing). */
export type Grid = Record<string, Record<string, string>>;

const toNumber = (text: string | undefined) => {
  const value = Number(text);
  return text && Number.isFinite(value) && value > 0 ? value : 0;
};
// `+ 0` turns -0 (a rounding artefact) into 0.
const round = (value: number) => Math.round(value * 10_000) / 10_000 + 0;
const asText = (value: number) => (value === 0 ? "" : String(round(value)));

/** Starting grid: the saved draft when there is one, otherwise the current allocations. */
export function initialGrid(view: Pick<Redistribution, "lines" | "draft">): Grid {
  const draftByProduct = new Map<string, Record<string, string>>();
  for (const entry of view.draft) {
    const row = draftByProduct.get(entry.productCode) ?? {};
    row[entry.locationCode] = asText(entry.quantity);
    draftByProduct.set(entry.productCode, row);
  }

  return Object.fromEntries(
    view.lines.map((line) => [
      line.productCode,
      draftByProduct.get(line.productCode) ??
        Object.fromEntries(line.allocations.map((a) => [a.locationCode, asText(a.quantity)])),
    ]),
  );
}

/** Grid built from the API's proportional proposal. */
export function gridFromAllocations(
  lines: readonly {
    productCode: string;
    allocations: readonly { locationCode: string; quantity: number }[];
  }[],
): Grid {
  return Object.fromEntries(
    lines.map((l) => [
      l.productCode,
      Object.fromEntries(l.allocations.map((a) => [a.locationCode, asText(a.quantity)])),
    ]),
  );
}

export function rowTotal(row: Record<string, string> | undefined): number {
  return round(Object.values(row ?? {}).reduce((sum, text) => sum + toNumber(text), 0));
}

/** Positive when units are still unassigned, negative when over-assigned. */
export function balance(confirmed: number, row: Record<string, string> | undefined): number {
  return round(confirmed - rowTotal(row));
}

export const isBalanced = (value: number) => Math.abs(value) <= TOTAL_TOLERANCE;

export function allBalanced(
  lines: readonly { productCode: string; confirmedQuantity: number }[],
  grid: Grid,
): boolean {
  return lines.every((line) => isBalanced(balance(line.confirmedQuantity, grid[line.productCode])));
}

/** Request body for saving or confirming. Empty and zero cells are omitted. */
export function toPlan(lines: readonly { productCode: string }[], grid: Grid): Plan {
  return {
    lines: lines.map((line) => ({
      productCode: line.productCode,
      allocations: Object.entries(grid[line.productCode] ?? {})
        .map(([locationCode, text]) => ({ locationCode, quantity: toNumber(text) }))
        .filter((allocation) => allocation.quantity > 0),
    })),
  };
}

/** Whether two grids hold the same quantities (ignoring empty cells and number formatting). */
export function sameGrid(a: Grid, b: Grid): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((product) => {
    const locations = new Set([...Object.keys(a[product] ?? {}), ...Object.keys(b[product] ?? {})]);
    return [...locations].every(
      (location) => toNumber(a[product]?.[location]) === toNumber(b[product]?.[location]),
    );
  });
}

/** Locations to show as columns: the order's own, warehouses first, keeping the original order within each kind. */
export function orderedLocations(locations: readonly OrderLocation[]): OrderLocation[] {
  const rank = { Warehouse: 0, Store: 1 } as const;
  return locations
    .map((location, index) => ({ location, index }))
    .sort((x, y) => rank[x.location.kind] - rank[y.location.kind] || x.index - y.index)
    .map(({ location }) => location);
}
