import { RiExternalLinkLine } from "@remixicon/react";
import { AlignLinkButton } from "../../ui/link-button";
import { Typography } from "../../ui/typography";

const resources = [
  {
    title: "CS50’s Introduction to Computer Science",
    url: "https://cs50.harvard.edu/x/",
    description:
      "CS50 is one of the best ways to get started with computer science. Work through its 12-part lecture series in your spare time and build your fundamentals along the way.",
  },
  {
    title: "DIKE UGM Skripsi LaTeX template",
    url: "https://github.com/vityasyyy/template-skripsi-dike-ugm",
    description:
      "Starting your proposal or skripsi? Use this LaTeX template as your starting point, then fill it with your own research.",
  },
  {
    title: "HIMAKOM UGM exam archive",
    url: "https://himakom.ugm.ac.id/exam",
    description:
      "Getting ready for an exam? Browse past papers from HIMAKOM UGM and find materials for your courses.",
  },
];

export function ResourcesPage() {
  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <Typography as="h1" variant="title" className="m-0 text-title-h3 sm:text-title-h2">
            Looking for a place to start?
          </Typography>
          <Typography as="p" variant="paragraph" className="mb-0 mt-5 max-w-md text-text-sub-600">
            Pick a resource that fits what you need and explore it at your own pace.
          </Typography>
        </header>
        <section
          aria-label="Helpful resources"
          className="grid content-start divide-y divide-stroke-soft-200"
        >
          {resources.map((resource) => (
            <article key={resource.url} className="py-6 first:pt-0 last:pb-0">
              <AlignLinkButton.Root
                asChild
                variant="black"
                className="h-auto max-w-full justify-start whitespace-normal text-left"
              >
                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                  <Typography as="span" variant="subtitle1" className="text-text-strong-950">
                    {resource.title}
                  </Typography>
                  <RiExternalLinkLine aria-hidden="true" className="size-4 shrink-0" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </AlignLinkButton.Root>
              <Typography as="p" variant="paragraph" className="mb-0 mt-3 text-text-sub-600">
                {resource.description}
              </Typography>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
