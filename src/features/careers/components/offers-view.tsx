"use client";

import { Briefcase, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonAnchor } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { prepareApplication, refreshOffers } from "../actions.server";
import type { OfferItem, OfferList, Preferences } from "../schemas";
import { statusVariant } from "../status";
import { useCareersError } from "../use-careers-error";
import { PreferencesPanel } from "./preferences-panel";

const POLL_MS = 5000;

/** Known sources get their proper name; a new one shows as the API calls it. */
function useSourceName() {
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

function OfferCard({
  offer,
  busy,
  onPrepare,
}: {
  offer: OfferItem;
  busy: boolean;
  onPrepare: () => void;
}) {
  const t = useTranslations("careers.offers");
  const status = useTranslations("careers.applications.status");
  const source = (name: string) =>
    t.has(`sources.${name}` as "sources.remotive")
      ? t(`sources.${name}` as "sources.remotive")
      : name;
  return (
    <Card className="flex-row flex-wrap items-center gap-4 px-4">
      <Score value={offer.score} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <h3 className="font-medium">{offer.title}</h3>
        <p className="line-clamp-1 text-sm text-muted-foreground" title={offer.location}>
          {[offer.company, offer.location, source(offer.source)].filter(Boolean).join(" · ")}
          {offer.alsoOn.length > 0 &&
            ` · ${t("alsoOn", { sources: offer.alsoOn.map(source).join(", ") })}`}
        </p>
        <div className="flex flex-wrap gap-1.5">
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
        <ButtonAnchor variant="outline" href={offer.url} target="_blank" rel="noopener noreferrer">
          {t("viewOffer")}
          <ExternalLink className="size-3.5" />
        </ButtonAnchor>
        {offer.applicationId && offer.applicationStatus ? (
          <Link href={`/careers/applications/${offer.applicationId}`}>
            <Badge variant={statusVariant(offer.applicationStatus)}>
              {status(offer.applicationStatus)}
            </Badge>
          </Link>
        ) : (
          <Button onClick={onPrepare} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? t("preparing") : t("prepare")}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function OffersView({ list, preferences }: { list: OfferList; preferences: Preferences }) {
  const t = useTranslations("careers.offers");
  const describe = useCareersError();
  const router = useRouter();
  const sourceName = useSourceName();
  const [refreshing, setRefreshing] = useState(false);
  const [preparing, setPreparing] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // While the AI service is still working out how well some offers fit, ask the server again by itself.
  useEffect(() => {
    if (list.pending === 0) return;
    const timer = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [list.pending, router]);

  const refresh = () =>
    startTransition(async () => {
      setRefreshing(true);
      const result = await refreshOffers(false);
      setRefreshing(false);
      if (!result.ok) {
        toast.error(describe(result.error));
        return;
      }
      toast.success(
        result.data.results
          .map((r) =>
            t("refreshSummary", {
              source: sourceName(r.source),
              outcome: t(`outcome.${r.outcome}`, { read: r.read, added: r.added }),
            }),
          )
          .join(" · "),
        { description: t("refreshNote") },
      );
      router.refresh();
    });

  const prepare = (id: string) =>
    startTransition(async () => {
      setPreparing(id);
      const result = await prepareApplication(id);
      if (!result.ok) {
        setPreparing(null);
        toast.error(describe(result.error));
        return;
      }
      router.push(`/careers/applications/${result.data.id}`);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {refreshing ? t("refreshing") : t("refresh")}
          </Button>
        }
      />

      <PreferencesPanel initial={preferences} />

      {list.pending > 0 && (
        <Alert role="status">
          <AlertDescription>{t("pending", { count: list.pending })}</AlertDescription>
        </Alert>
      )}

      {list.total === 0 ? (
        <EmptyState icon={Briefcase} title={t("empty")} description={t("emptyHint")} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("summary", {
              shown: list.offers.length,
              total: list.total,
              excluded: list.excluded,
            })}
          </p>
          <ul className="space-y-3">
            {list.offers.map((offer) => (
              <li key={offer.id}>
                <OfferCard
                  offer={offer}
                  busy={preparing === offer.id}
                  onPrepare={() => prepare(offer.id)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
