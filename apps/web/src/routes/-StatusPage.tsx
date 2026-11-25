import { defaultCurriculumId } from "@g13/curriculum/ids";
import { StatusIllustration } from "../ui/status-illustration";
import { Typography } from "../ui/typography";
import { AlignButton } from "../ui/button";
import { RiArrowLeftLine, RiRefreshLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function StatusPage({ kind, reset }: { kind: "notFound" | "error"; reset?: () => void }) {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-6 py-16 text-center">
      <div className="flex w-full max-w-lg flex-col items-center">
        <StatusIllustration kind={kind} />
        <Typography as="h1" variant="title">
          {t(`${kind}.title`)}
        </Typography>
        <Typography color="muted" className="mt-3">
          {t(`${kind}.description`)}
        </Typography>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {kind === "error" && (
            <AlignButton.Root onClick={reset}>
              <RiRefreshLine className="size-5" />
              {t("error.retry")}
            </AlignButton.Root>
          )}
          <AlignButton.Root
            asChild
            variant={kind === "error" ? "neutral" : "primary"}
            mode={kind === "error" ? "stroke" : "filled"}
          >
            <Link to="/" search={{ kurikulum: defaultCurriculumId }}>
              <RiArrowLeftLine className="size-5" />
              {t("notFound.home")}
            </Link>
          </AlignButton.Root>
        </div>
      </div>
    </main>
  );
}
