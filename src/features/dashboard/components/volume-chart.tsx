import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/formatters";
import { barLayout } from "../chart-math";
import type { DashboardSummary } from "../schemas";

const WIDTH = 600;
const HEIGHT = 140;

/** Bars of new orders per day. Each bar carries its own text alternative (title + aria-label on the figure). */
export function VolumeChart({ days }: { days: DashboardSummary["last30Days"] }) {
  const t = useTranslations("dashboard.volume");
  const f = useFormatters();
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const bars = barLayout(
    days.map((day) => day.count),
    WIDTH,
    HEIGHT,
  );
  const first = days[0];
  const last = days.at(-1);

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-medium">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <p className="text-sm font-medium tabular-nums">{t("total", { count: total })}</p>
      </div>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <figure className="mt-4">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={t("chartLabel")}
            className="h-40 w-full"
            preserveAspectRatio="none"
          >
            {bars.map((bar, index) => {
              const day = days[index]!;
              return (
                <rect
                  key={day.date}
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  rx={2}
                  className={day.count === 0 ? "fill-muted" : "fill-primary"}
                >
                  <title>{t("bar", { date: f.date(day.date), count: day.count })}</title>
                </rect>
              );
            })}
          </svg>
          {first && last && (
            <figcaption className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{f.shortDate(first.date)}</span>
              <span>{f.shortDate(last.date)}</span>
            </figcaption>
          )}
        </figure>
      )}
    </section>
  );
}
