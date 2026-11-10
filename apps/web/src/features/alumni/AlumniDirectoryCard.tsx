import { RiBriefcaseLine, RiBuildingLine, RiLinkedinBoxFill } from "@remixicon/react";
import { useLocale } from "../../useLocale";
import { AlignBadge } from "../../ui/badge";
import { AlignButton } from "../../ui/button";
import { Typography } from "../../ui/typography";
import { alumniAvatarTone, alumniInitials, type AlumniCard } from "./directory";

/**
 * Initials avatar. LinkedIn blocks automated access to profile photos (`HTTP 999`) and
 * the Strapi collection has no photo field, so initials are the permanent base layer.
 */
function AlumniAvatar({ alumnus }: { alumnus: AlumniCard }) {
  const initials = alumniInitials(alumnus.name);
  const tone = alumniAvatarTone(alumnus.id);

  return (
    <div
      aria-hidden="true"
      className={`grid size-14 shrink-0 place-items-center rounded-full text-label-lg ring-4 ring-bg-white-0 ${tone.solid}`}
    >
      {initials}
    </div>
  );
}

/** One line inside the role block: fixed-width icon gutter, text beside it. */
function RoleLine({
  icon,
  primary,
  value,
}: {
  icon: React.ReactNode;
  primary?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-px grid size-4 shrink-0 place-items-center text-text-soft-400">
        {icon}
      </span>
      <Typography
        as="p"
        variant={primary ? "label" : "caption"}
        className={`m-0 break-words ${primary ? "text-text-strong-950" : "text-text-sub-600"}`}
        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
      >
        {value}
      </Typography>
    </div>
  );
}

export function AlumniDirectoryCard({ alumnus }: { alumnus: AlumniCard }) {
  const { text } = useLocale("alumni");
  const tone = alumniAvatarTone(alumnus.id);
  const hasRole = Boolean(alumnus.position || alumnus.employer);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-10 border border-stroke-soft-200 bg-bg-white-0 transition duration-200 ease-out hover:border-stroke-sub-300">
      {/* Tinted band: avatar left, LinkedIn shortcut top-right. */}
      <div
        className={`relative flex items-start justify-between gap-3 px-5 pb-4 pt-5 ${tone.band}`}
      >
        <AlumniAvatar alumnus={alumnus} />
        {alumnus.linkedin ? (
          <AlignButton.Root asChild variant="neutral" mode="stroke" className="size-9 shrink-0 p-2">
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
        ) : (
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-text-soft-400 opacity-40"
          >
            <RiLinkedinBoxFill className="size-5" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <Typography
          as="h3"
          variant="subtitle2"
          className="m-0 break-words text-text-strong-950"
          // Names are the only long free-form text; clamp keeps 226 cards even.
          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {alumnus.name}
        </Typography>
        <div className="mt-1">
          <AlignBadge.Root variant="lighter" size="medium">
            {text("Angkatan {{v0}}", { v0: String(alumnus.batch) })}
          </AlignBadge.Root>
        </div>

        {hasRole && (
          <div className="mt-4 flex flex-col gap-1.5 rounded-lg bg-bg-weak-50 px-3 py-2.5">
            {alumnus.position && (
              <RoleLine
                icon={<RiBriefcaseLine className="size-4" />}
                primary
                value={alumnus.position}
              />
            )}
            {alumnus.employer && (
              <RoleLine icon={<RiBuildingLine className="size-4" />} value={alumnus.employer} />
            )}
          </div>
        )}
      </div>
    </article>
  );
}
