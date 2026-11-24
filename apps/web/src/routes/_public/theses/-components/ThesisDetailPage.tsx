import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { RiArrowLeftLine, RiExternalLinkLine, RiMailLine } from "@remixicon/react";
import { useLocale } from "@/useLocale";
import { Typography } from "@/ui/typography";
import {
  abstractParagraphs,
  citationFor,
  thesisLanguageLabelKey,
  thesisTypeLabelKey,
  type ThesisContact,
  type ThesisDetail,
  type ThesisSupervisor,
} from "../-shared/thesis";

function BackLink() {
  const { text } = useLocale("theses");
  return (
    <Link
      to="/theses"
      className="inline-flex items-center gap-1.5 text-label-sm text-text-sub-600 hover:text-text-strong-950"
    >
      <RiArrowLeftLine aria-hidden="true" className="size-4" />
      {text("Back to theses")}
    </Link>
  );
}

function SupervisorItem({ supervisor }: { supervisor: ThesisSupervisor }) {
  const { text } = useLocale("theses");
  const role =
    supervisor.role === "main"
      ? text("Main supervisor")
      : supervisor.role === "co"
        ? text("Co-supervisor")
        : null;
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {supervisor.lecturerId ? (
        <Link
          to="/lecturers/$lecturerId"
          params={{ lecturerId: supervisor.lecturerId }}
          className="text-label-sm text-primary-base hover:underline"
        >
          {supervisor.name}
        </Link>
      ) : (
        <Typography as="span" variant="label">
          {supervisor.name}
        </Typography>
      )}
      {role && (
        <Typography as="span" variant="caption" color="muted">
          {role}
        </Typography>
      )}
    </li>
  );
}

function SupervisorSection({ supervisors }: { supervisors: ThesisSupervisor[] }) {
  const { text } = useLocale("theses");
  return (
    <section aria-labelledby="thesis-supervisors">
      <Typography as="h2" variant="subtitle2" id="thesis-supervisors" className="m-0">
        {text("Supervisors")}
      </Typography>
      {supervisors.length ? (
        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
          {supervisors.map((supervisor, index) => (
            <SupervisorItem key={`${supervisor.name}-${index}`} supervisor={supervisor} />
          ))}
        </ul>
      ) : (
        <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-3">
          {text("No supervisors listed.")}
        </Typography>
      )}
    </section>
  );
}

function MetadataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <Typography as="dt" variant="labelSmall" color="muted">
        {label}
      </Typography>
      <Typography as="dd" variant="paragraph" className="m-0 min-w-0 break-words">
        {children}
      </Typography>
    </>
  );
}

function MetadataSection({ thesis }: { thesis: ThesisDetail }) {
  const { text } = useLocale("theses");
  return (
    <section aria-labelledby="thesis-metadata">
      <Typography as="h2" variant="subtitle2" id="thesis-metadata" className="m-0">
        {text("Thesis details")}
      </Typography>
      <dl className="m-0 mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <MetadataRow label={text("Year")}>{thesis.year}</MetadataRow>
        <MetadataRow label={text("Type")}>{text(thesisTypeLabelKey(thesis.type))}</MetadataRow>
        {thesis.field && <MetadataRow label={text("Field")}>{thesis.field}</MetadataRow>}
        <MetadataRow label={text("Language")}>
          {text(thesisLanguageLabelKey(thesis.language))}
        </MetadataRow>
        {thesis.keywords.length > 0 && (
          <MetadataRow label={text("Keywords")}>
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {thesis.keywords.map((keyword) => (
                <li key={keyword}>
                  <span className="inline-block rounded-md bg-bg-weak-50 px-2.5 py-1 text-label-2xs">
                    {keyword}
                  </span>
                </li>
              ))}
            </ul>
          </MetadataRow>
        )}
      </dl>
    </section>
  );
}

function AbstractBody({ value }: { value: string }) {
  return abstractParagraphs(value).map((paragraph, index) => (
    <Typography
      as="p"
      variant="paragraph"
      key={`${index}-${paragraph.slice(0, 12)}`}
      className="mb-0 mt-3 whitespace-pre-line"
    >
      {paragraph}
    </Typography>
  ));
}

function AbstractSection({ thesis }: { thesis: ThesisDetail }) {
  const { text } = useLocale("theses");
  return (
    <section aria-labelledby="thesis-abstract">
      <Typography as="h2" variant="subtitle2" id="thesis-abstract" className="m-0">
        {text("Abstract")}
      </Typography>
      {thesis.abstract && <AbstractBody value={thesis.abstract} />}
      {thesis.abstractEn && (
        <>
          <Typography as="h3" variant="label" className="mb-0 mt-5">
            {text("Abstract (English)")}
          </Typography>
          <AbstractBody value={thesis.abstractEn} />
        </>
      )}
      {!thesis.abstract && !thesis.abstractEn && (
        <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-3">
          {text("Abstract not published")}
        </Typography>
      )}
    </section>
  );
}

function ContactLink({ contact }: { contact: ThesisContact }) {
  const { text } = useLocale("theses");
  if (contact.channel === "email") {
    return (
      <a
        href={`mailto:${contact.value}`}
        className="inline-flex min-w-0 items-center gap-1.5 break-all text-label-sm text-primary-base hover:underline"
      >
        <RiMailLine aria-hidden="true" className="size-4 shrink-0" />
        {text("Contact the author")}: {contact.value}
      </a>
    );
  }
  return (
    <a
      href={contact.value}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-0 items-center gap-1.5 break-all text-label-sm text-primary-base hover:underline"
    >
      <RiExternalLinkLine aria-hidden="true" className="size-4 shrink-0" />
      {text("Contact the author")}: {contact.value}
    </a>
  );
}

function FullTextSection({ thesis }: { thesis: ThesisDetail }) {
  const { text } = useLocale("theses");
  return (
    <section aria-labelledby="thesis-full-text">
      <Typography as="h2" variant="subtitle2" id="thesis-full-text" className="m-0">
        {text("Full text")}
      </Typography>
      <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-3">
        {text("This site does not host the full text.")}
      </Typography>
      {thesis.repositoryUrl && (
        <Typography as="p" variant="paragraph" className="mb-0 mt-3">
          <a
            href={thesis.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 break-all text-primary-base hover:underline"
          >
            <RiExternalLinkLine aria-hidden="true" className="size-4 shrink-0" />
            {text("View thesis link")}
          </a>
        </Typography>
      )}
      {thesis.contact && (
        <div className="mt-3">
          <ContactLink contact={thesis.contact} />
        </div>
      )}
      {!thesis.repositoryUrl && !thesis.contact && (
        <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-3">
          {text("No full text is currently available.")}
        </Typography>
      )}
    </section>
  );
}

function CitationSection({ thesis }: { thesis: ThesisDetail }) {
  const { text } = useLocale("theses");
  const citation = citationFor(thesis, text(thesisTypeLabelKey(thesis.type)));
  return (
    <section aria-labelledby="thesis-citation">
      <Typography as="h2" variant="subtitle2" id="thesis-citation" className="m-0">
        {text("Citation")}
      </Typography>
      <Typography as="p" variant="paragraph" className="mb-0 mt-3 break-words">
        {citation}
      </Typography>
    </section>
  );
}

function NoteSection() {
  const { text } = useLocale("theses");
  return (
    <footer className="grid gap-4 border-t border-stroke-soft-200 pt-6">
      <Typography as="p" variant="caption" color="muted" className="m-0">
        {text("Data and abstract are published with the author's permission.")}
      </Typography>
      <section aria-labelledby="thesis-correction">
        <Typography as="h2" variant="subtitle2" id="thesis-correction" className="m-0">
          {text("Correction or removal")}
        </Typography>
        <Typography as="p" variant="paragraph" color="muted" className="mb-0 mt-2">
          {text("If something is wrong or you want this record removed, contact the maintainer.")}{" "}
          <a
            href="https://github.com/Andhiki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-base hover:underline"
          >
            {text("Contact the maintainer")}
          </a>
        </Typography>
      </section>
    </footer>
  );
}

export function ThesisDetailPage({ thesis }: { thesis: ThesisDetail }) {
  const { text } = useLocale("theses");
  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-12 lg:px-12">
      <article className="mx-auto grid max-w-3xl gap-8">
        <BackLink />
        <header>
          <Typography as="h1" variant="title" className="m-0 break-words">
            {thesis.title}
          </Typography>
          <Typography as="p" variant="label" className="mb-0 mt-3 break-words">
            {thesis.authorName}
            {thesis.authorBatch !== null && (
              <Typography as="span" variant="caption" color="muted">
                {" · "}
                {text("Batch {{year}}", { year: String(thesis.authorBatch) })}
              </Typography>
            )}
          </Typography>
        </header>
        <SupervisorSection supervisors={thesis.supervisors} />
        <MetadataSection thesis={thesis} />
        <AbstractSection thesis={thesis} />
        <FullTextSection thesis={thesis} />
        <CitationSection thesis={thesis} />
        <NoteSection />
        <BackLink />
      </article>
    </main>
  );
}
