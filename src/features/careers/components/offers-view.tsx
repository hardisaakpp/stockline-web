"use client";

import { Briefcase, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/feedback/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { actOnApplication, prepareApplication, refreshOffers } from "../actions.server";
import type { OfferList, Preferences } from "../schemas";
import { useCareersError } from "../use-careers-error";
import { useViewedOffers } from "../use-viewed-offers";
import { OfferCard, useSourceName } from "./offer-card";
import { PreferencesPanel } from "./preferences-panel";

const POLL_MS = 5000;

function PendingNotice({ count }: { count: number }) {
  const t = useTranslations("careers.offers");
  return (
    <Alert role="status">
      <AlertDescription>{t("pending", { count })}</AlertDescription>
    </Alert>
  );
}

export function OffersView({
  list,
  preferences,
  userId,
}: {
  list: OfferList;
  preferences: Preferences;
  /** Whose list of opened offers is kept in this browser. */
  userId: string;
}) {
  const t = useTranslations("careers.offers");
  const describe = useCareersError();
  const router = useRouter();
  const sourceName = useSourceName();
  const done = useTranslations("careers.applications.done");
  const viewed = useViewedOffers(userId);
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

  const reopen = (offerId: string, applicationId: string) =>
    startTransition(async () => {
      setPreparing(offerId);
      const result = await actOnApplication(applicationId, "reopen");
      setPreparing(null);
      if (!result.ok) {
        toast.error(describe(result.error));
        return;
      }
      toast.success(done("reopen"));
      router.refresh();
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

      {list.pending > 0 && <PendingNotice count={list.pending} />}

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
                  viewed={viewed.isViewed(offer.id)}
                  onPrepare={() => prepare(offer.id)}
                  onOpen={() => viewed.mark(offer.id)}
                  onUnview={() => viewed.unmark(offer.id)}
                  onReopen={() => offer.applicationId && reopen(offer.id, offer.applicationId)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
