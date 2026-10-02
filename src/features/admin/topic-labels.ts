import { useTranslations } from "next-intl";
import type { EmailTopic } from "./schemas";

const KNOWN_TOPICS = [
  "OrderSubmitted",
  "OrderCancelledByBuyer",
  "OrderRejected",
  "OrderDiscarded",
  "OrderCancelledBySupplier",
  "ProductionConfirmed",
  "RedistributionConfirmed",
  "ReadyForDispatch",
  "ErpSubmissionFailed",
] as const;
const KNOWN_AUDIENCES = ["Buyer", "Supplier", "SupplierProduction", "Technical"] as const;
const isIn = <T extends readonly string[]>(list: T, value: string): value is T[number] =>
  (list as readonly string[]).includes(value);

/** Plain-language names for topics and audiences; unknown ones fall back to what the API sent. */
export function useTopicLabels() {
  const t = useTranslations("admin.notifications");
  return {
    title: (topic: EmailTopic) =>
      isIn(KNOWN_TOPICS, topic.topic) ? t(`topics.${topic.topic}.title`) : topic.subject,
    description: (topic: EmailTopic) =>
      isIn(KNOWN_TOPICS, topic.topic) ? t(`topics.${topic.topic}.description`) : topic.description,
    audience: (audience: string) =>
      isIn(KNOWN_AUDIENCES, audience) ? t(`audiences.${audience}`) : audience,
  };
}
