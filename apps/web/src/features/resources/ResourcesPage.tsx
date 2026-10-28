import { RiExternalLinkLine } from "@remixicon/react";
import { AlignLinkButton } from "../../ui/link-button";
import { Typography } from "../../ui/typography";

const resources = [
  {
    title: "CS50’s Introduction to Computer Science",
    url: "https://cs50.harvard.edu/x/",
    description:
      "Harvard’s introduction to computer science, covering core concepts through problem sets and projects.",
  },
  {
    title: "Skripsi LaTeX template",
    url: "https://github.com/vityasyyy/skripsi",
    description: "An open-source LaTeX template for writing a skripsi.",
  },
  {
    title: "HIMAKOM UGM exam archive",
    url: "https://himakom.ugm.ac.id/exam",
    description:
      "The original HIMAKOM UGM archive that provides the exam materials featured on this site.",
  },
];

export function ResourcesPage() {
  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <Typography as="h1" variant="title" className="m-0 text-title-h3 sm:text-title-h2">
            Helpful Resources
          </Typography>
          <Typography as="p" variant="paragraph" className="mb-0 mt-5 max-w-md text-text-sub-600">
            A few useful places to learn, prepare, and find past exams.
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
