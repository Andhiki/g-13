import { RiGithubFill } from "@remixicon/react";
import { useLocale } from "@/useLocale";
import { AlignFancyButton } from "@/ui/fancy-button";
import { AlignLinkButton } from "@/ui/link-button";
import { Typography } from "@/ui/typography";

const thesisSubmissionUrl =
  "https://github.com/Andhiki/g-13/issues/new?template=thesis_submission.yml";
const maintainerProfileUrl = "https://github.com/Andhiki";

export function ThesisSubmissionCta() {
  const { text } = useLocale("theses");
  return (
    <section
      aria-labelledby="thesis-submission-heading"
      className="rounded-10 border border-stroke-soft-200 bg-bg-weak-50 p-4 sm:p-5"
    >
      <Typography as="h2" variant="subtitle2" id="thesis-submission-heading" className="m-0">
        {text("Have a thesis to showcase?")}
      </Typography>
      <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-2">
        {text(
          "Submit your thesis through GitHub. A maintainer will review it before it appears here.",
        )}
      </Typography>
      <Typography as="p" variant="caption" color="muted" className="mb-0 mt-2">
        {text(
          "The issue is public. Do not include NIM, grades, transcripts, phone numbers, or private email addresses.",
        )}
      </Typography>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <AlignFancyButton.Root asChild size="small">
          <a href={thesisSubmissionUrl} target="_blank" rel="noopener noreferrer">
            <RiGithubFill aria-hidden="true" className="size-4" />
            {text("Open the submission form")}
          </a>
        </AlignFancyButton.Root>
        <AlignLinkButton.Root
          asChild
          variant="gray"
          size="small"
          className="h-auto whitespace-normal text-start"
        >
          <a href={maintainerProfileUrl} target="_blank" rel="noopener noreferrer">
            {text("No GitHub or need private contact? Contact the maintainer.")}
          </a>
        </AlignLinkButton.Root>
      </div>
    </section>
  );
}
