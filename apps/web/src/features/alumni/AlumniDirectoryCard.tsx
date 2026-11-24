import { RiBriefcaseLine, RiGraduationCapLine, RiLinkedinBoxFill } from "@remixicon/react";
import { useLocale } from "../../useLocale";
import { AlignButton } from "../../ui/button";
import { alumniAvatarTone, alumniInitials, type AlumniCard } from "./directory";
import { companyLogo } from "./company-logo";

export function AlumniDirectoryCard({ alumnus }: { alumnus: AlumniCard }) {
  const { text } = useLocale("alumni");
  const tone = alumniAvatarTone(alumnus.id);
  const logo = companyLogo(alumnus.employer);

  return (
    <article className="h-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-4">
      <div className="flex min-h-10 items-center gap-3">
        <div
          aria-hidden="true"
          className={`grid size-8 shrink-0 place-items-center rounded-full text-label-sm ${tone.solid}`}
        >
          {alumniInitials(alumnus.name)}
        </div>
        <h3 className="m-0 min-w-0 flex-1 break-words text-label-md text-text-strong-950">
          {alumnus.name}
        </h3>
        {alumnus.linkedin && (
          <AlignButton.Root asChild variant="neutral" mode="ghost" className="size-10 shrink-0 p-2">
            <a
              href={alumnus.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={text("Buka LinkedIn {{v0}} (tab baru)", { v0: alumnus.name })}
              title="LinkedIn"
            >
              <RiLinkedinBoxFill aria-hidden="true" className="size-5" />
            </a>
          </AlignButton.Root>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2 text-paragraph-sm text-text-sub-600">
        {(alumnus.position || alumnus.employer) && (
          <div className="flex items-start gap-2">
            <RiBriefcaseLine aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p className="m-0 min-w-0 break-words">
              {alumnus.position && (
                <span className="text-label-sm text-text-strong-950">{alumnus.position}</span>
              )}
              {alumnus.position && alumnus.employer && <span className="mx-1.5">{text("di")}</span>}
              {logo && (
                <img
                  src={logo}
                  alt=""
                  className="mr-1.5 inline-block h-4 w-auto max-w-12 align-[-3px] object-contain dark:brightness-125"
                />
              )}
              {alumnus.employer && (
                <span className="text-label-sm text-text-strong-950">{alumnus.employer}</span>
              )}
            </p>
          </div>
        )}
        <div className="flex items-start gap-2">
          <RiGraduationCapLine aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p className="m-0 min-w-0 break-words">
            {alumnus.education && `${alumnus.education} · `}
            {text("Angkatan {{v0}}", { v0: String(alumnus.batch) })}
          </p>
        </div>
      </div>
    </article>
  );
}
