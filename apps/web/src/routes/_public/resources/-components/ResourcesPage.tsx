import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocale } from "@/useLocale";
import { RiExternalLinkLine } from "@remixicon/react";
import { AlignLinkButton } from "@/ui/link-button";
import { Typography } from "@/ui/typography";
import { learningResourcesQueryOptions } from "../-client/queries";

export function ResourcesPage() {
  const { data: resources } = useSuspenseQuery(learningResourcesQueryOptions());
  const { text, language } = useLocale("resources");
  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <Typography as="h1" variant="pageTitle" className="m-0">
            {text("Learning resources")}
          </Typography>
        </header>
        <section
          aria-label={text("Helpful resources")}
          className="grid content-start divide-y divide-stroke-soft-200"
        >
          {resources.map((resource) => {
            const title = language === "en" ? resource.titleEn : resource.titleId;
            const description = language === "en" ? resource.descriptionEn : resource.descriptionId;
            return (
              <article key={resource.id} className="py-6 first:pt-0 last:pb-0">
                <AlignLinkButton.Root
                  asChild
                  variant="black"
                  className="h-auto max-w-full justify-start whitespace-normal text-left"
                >
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <Typography as="span" variant="subtitle1" color="strong">
                      {title}
                    </Typography>
                    <RiExternalLinkLine aria-hidden="true" className="size-4 shrink-0" />
                    <span className="sr-only"> {text("(opens in a new tab)")}</span>
                  </a>
                </AlignLinkButton.Root>
                <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-3">
                  {description}
                </Typography>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
