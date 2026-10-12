"use client";

import { Eye, ExternalLink, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OfferItem } from "../schemas";
import { statusVariant } from "../status";

/** Known sources get their proper name; a new one shows as the API calls it. */
export function useSourceName() {
  const t = useTranslations("careers.offers.sources");
  return (name: string) => (t.has(name as "remotive") ? t(name as "remotive") : name);
}

function Score({ value }: { value: number }) {
  const t = useTranslations("careers.offers");
  return (
    <div className="w-24 shrink-0" title={t("score", { score: Math.round(value) })}>
      <div className="text-lg font-semibold tabular-nums">{Math.round(value)}</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

/** What the person can do about the offer's application: prepare one, follow it, or reopen a discarded one. */
function ApplicationControl({
  offer,
  busy,
  onPrepare,
  onReopen,
}: {
  offer: OfferItem;
  busy: boolean;
  onPrepare: () => void;
  onReopen: () => void;
}) {
  const t = useTranslations("careers.offers");
  const status = useTranslations("careers.applications.status");
  return offer.applicationId && offer.applicationStatus ? (
    <>
      <Link href={`/careers/applications/${offer.applicationId}`}>
        <Badge variant={statusVariant(offer.applicationStatus)}>
          {status(offer.applicationStatus)}
        </Badge>
      </Link>
      {offer.applicationStatus === "Discarded" && (
        <Button variant="outline" size="sm" onClick={onReopen} disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {t("reopen")}
        </Button>
      )}
    </>
  ) : (
    <Button onClick={onPrepare} disabled={busy}>
      {busy && <Loader2 className="size-4 animate-spin" />}
      {busy ? t("preparing") : t("prepare")}
    </Button>
  );
}

export function OfferCard({
  offer,
  busy,
  viewed,
  onPrepare,
  onOpen,
  onUnview,
  onReopen,
}: {
  offer: OfferItem;
  busy: boolean;
  /** The person already opened the offer's page: the card is tinted and says so. */
  viewed: boolean;
  onPrepare: () => void;
  onOpen: () => void;
  onUnview: () => void;
  onReopen: () => void;
}) {
  const t = useTranslations("careers.offers");
  const source = (name: string) =>
    t.has(`sources.${name}` as "sources.remotive")
      ? t(`sources.${name}` as "sources.remotive")
      : name;
  return (
    <Card
      className={cn(
        "flex-row flex-wrap items-center gap-4 px-4",
        viewed && "bg-primary/10 ring-primary/30",
      )}
    >
      <Score value={offer.score} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("font-medium", viewed && "text-muted-foreground")}>{offer.title}</h3>
          {viewed && (
            <button
              type="button"
              aria-label={t("unview")}
              title={t("unview")}
              onClick={onUnview}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge variant="secondary">
                <Eye aria-hidden />
                {t("viewed")}
              </Badge>
            </button>
          )}
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground" title={offer.location}>
          {[offer.company, offer.location, source(offer.source)].filter(Boolean).join(" · ")}
          {offer.alsoOn.length > 0 &&
            ` · ${t("alsoOn", { sources: offer.alsoOn.map(source).join(", ") })}`}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {offer.requiredYears === null ? (
            <Badge variant="outline" className="text-muted-foreground">
              {t("experience.none")}
            </Badge>
          ) : (
            <Badge variant="outline">{t("experience.asks", { years: offer.requiredYears })}</Badge>
          )}
          {offer.matches.length === 0 && (
            <span className="text-xs text-muted-foreground">{t("noMatches")}</span>
          )}
          {offer.matches.map((match) => (
            <Badge key={match} variant="secondary">
              {match}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ButtonAnchor
          variant="outline"
          href={offer.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          onAuxClick={onOpen}
        >
          {t("viewOffer")}
          <ExternalLink className="size-3.5" />
        </ButtonAnchor>
        <ApplicationControl offer={offer} busy={busy} onPrepare={onPrepare} onReopen={onReopen} />
      </div>
    </Card>
  );
}
