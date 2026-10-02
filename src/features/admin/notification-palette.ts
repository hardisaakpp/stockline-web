/** One colour per audience, shared by cards, badges and the catalogue so a topic reads the same everywhere. */
export type Palette = {
  badge: string;
  selected: string;
  circle: string;
  dot: string;
  subtle: string;
};

// Tailwind only generates classes it can see as whole strings, so each palette is spelled out.
const SKY: Palette = {
  badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  selected: "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  circle: "bg-sky-600",
  dot: "bg-sky-500",
  subtle:
    "border-sky-100 bg-sky-50/60 hover:border-sky-200 hover:bg-sky-50 dark:border-sky-900/40 dark:bg-sky-900/10 dark:hover:bg-sky-900/20",
};
const AMBER: Palette = {
  badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  selected: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  circle: "bg-amber-600",
  dot: "bg-amber-500",
  subtle:
    "border-amber-100 bg-amber-50/60 hover:border-amber-200 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10 dark:hover:bg-amber-900/20",
};
const PURPLE: Palette = {
  badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  selected:
    "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  circle: "bg-purple-600",
  dot: "bg-purple-500",
  subtle:
    "border-purple-100 bg-purple-50/60 hover:border-purple-200 hover:bg-purple-50 dark:border-purple-900/40 dark:bg-purple-900/10 dark:hover:bg-purple-900/20",
};
const NEUTRAL: Palette = {
  badge: "bg-muted text-foreground",
  selected: "border-foreground/40 bg-muted text-foreground",
  circle: "bg-muted-foreground",
  dot: "bg-muted-foreground",
  subtle: "border-border bg-background hover:bg-muted/60",
};

const BY_AUDIENCE: Record<string, Palette> = {
  Buyer: SKY,
  Supplier: AMBER,
  SupplierProduction: PURPLE,
};

export const paletteFor = (audience: string): Palette => BY_AUDIENCE[audience] ?? NEUTRAL;
