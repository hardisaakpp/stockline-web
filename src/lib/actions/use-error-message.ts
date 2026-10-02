import { useTranslations } from "next-intl";
import type { ActionError } from "./result";

/**
 * Turns a failed action into text in the current language. Rule violations are listed one by one:
 * the API's own wording (English) is only a last resort for codes the catalog does not know yet.
 */
export function useErrorMessage() {
  const t = useTranslations();

  return (error: ActionError): string => {
    const base = t(`errors.${error.code}`);
    if (error.issues.length === 0) return base;

    const details = error.issues.map((issue) => {
      // The API may report codes this client does not know yet, so the key is checked at runtime.
      const key = `issues.${issue.code}` as "issues.TOTAL_MISMATCH";
      const known = t.has(key) ? t(key) : issue.message;
      return issue.productCode ? `${issue.productCode}: ${known}` : known;
    });
    return `${base} ${[...new Set(details)].join(" ")}`;
  };
}
