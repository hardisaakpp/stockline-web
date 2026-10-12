"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** Why saving or previewing failed, with the fields the server objected to. */
export function CvErrorAlert({ message, problems }: { message: string; problems: string[] }) {
  const t = useTranslations("careers.cv");
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="size-4" />
      <AlertDescription>
        {message}
        {problems.length > 0 && (
          <>
            {" "}
            {t("problems")}
            <ul className="mt-1 list-disc pl-5">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}
