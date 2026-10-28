import { RiLinkedinBoxFill } from "@remixicon/react";
import { AlignButton } from "../../ui/button";
import { Typography } from "../../ui/typography";

type AlumniProfile = {
  name: string;
  cohort: string;
  currentRole: string;
  achievement: string;
  linkedinUrl: string;
  photo: string;
  experience: { company: string; role: string; period: string }[];
};

const alumniProfiles: AlumniProfile[] = [
  {
    name: "Daniel Winston Mandela Tulung",
    cohort: "Angkatan 2023",
    currentRole: "Data Product Management Intern · Shopee",
    achievement:
      "Selected for the CIMB Niaga Scholarship (2025–27), DiscoverNUS 2026, and TF-LEaRN NTU 2025. As GDGoC UGM Lead, he helped five community teams reach the 2025 Google Solution Challenge APAC Top 50.",
    linkedinUrl: "https://www.linkedin.com/in/danielwinstonmandela/",
    photo: "/alumni/daniel-winston-mandela-tulung.png",
    experience: [
      {
        company: "Shopee",
        role: "Data Product Management Intern · Data Governance",
        period: "Aug 2026–present",
      },
      {
        company: "tiket.com",
        role: "Product Management Intern · Pricing",
        period: "Oct 2025–Apr 2026",
      },
    ],
  },
  {
    name: "Albert Cristianto Halim",
    cohort: "Angkatan 2022",
    currentRole: "Product Development Consultant · Masterhooks",
    achievement:
      "At OPPO Indonesia, he built tools that improved manufacturing process consistency from 63% to 80% and layout standardization from 64% to 80%.",
    linkedinUrl: "https://www.linkedin.com/in/albert-cristianto-halim/",
    photo: "/alumni/albert-cristianto-halim.png",
    experience: [
      {
        company: "Masterhooks",
        role: "Product Development Consultant",
        period: "Apr 2026–present",
      },
      {
        company: "Shopee · SPX Express",
        role: "Junior Associate Product Manager",
        period: "Mar–Aug 2026",
      },
      { company: "Traveloka", role: "Product Manager Intern", period: "Aug 2025–Jan 2026" },
      {
        company: "OPPO Indonesia Manufacturing",
        role: "Software Engineer Intern",
        period: "Jan–Apr 2025",
      },
    ],
  },
  {
    name: "Wenka Wendira Putri Bun",
    cohort: "Angkatan 2022",
    currentRole: "Associate Product Manager · tiket.com",
    achievement:
      "As OmahTI’s CEO in 2024, she led an organization of more than 80 members across eight divisions.",
    linkedinUrl: "https://www.linkedin.com/in/wenkawendira/",
    photo: "/alumni/wenka-wendira-putri-bun.png",
    experience: [
      {
        company: "tiket.com",
        role: "Associate Product Manager",
        period: "Oct 2025–present",
      },
      {
        company: "Paper.id",
        role: "Product Intern → Product Analyst",
        period: "Jan–Oct 2025",
      },
      { company: "Pameo", role: "Product Development Intern", period: "Sep–Dec 2024" },
    ],
  },
];

function AlumniStoryCard({ story }: { story: AlumniProfile }) {
  return (
    <article className="rounded-10 border border-stroke-soft-200 bg-bg-white-0 p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-full border border-stroke-soft-200 bg-bg-weak-50 sm:size-24">
            <img
              src={story.photo}
              alt={story.name}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <Typography as="h2" variant="subtitle1" className="m-0 text-text-strong-950">
              {story.name}
            </Typography>
            <Typography as="p" variant="label" className="m-0 text-text-sub-600">
              {story.currentRole}
            </Typography>
            <Typography as="p" variant="caption" className="m-0 text-text-sub-600">
              {story.cohort}
            </Typography>
          </div>
        </div>
        <AlignButton.Root
          asChild
          variant="neutral"
          mode="stroke"
          className="size-10 shrink-0 p-2.5"
        >
          <a
            href={story.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${story.name} on LinkedIn (opens in a new tab)`}
            title="LinkedIn"
          >
            <RiLinkedinBoxFill aria-hidden="true" className="size-5" />
          </a>
        </AlignButton.Root>
      </div>
      <Typography as="p" variant="paragraph" className="mb-0 mt-5">
        {story.achievement}
      </Typography>
      <Typography as="h3" variant="label" className="mb-0 mt-6">
        Selected experience
      </Typography>
      <ul className="mb-0 mt-3 space-y-3 border-l border-stroke-soft-200 pl-4">
        {story.experience.map(({ company, role, period }) => (
          <li key={`${company}-${role}`}>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Typography as="strong" variant="label">
                {company}
              </Typography>
              <Typography as="span" variant="paragraph" className="text-text-sub-600">
                {role}
              </Typography>
            </div>
            <Typography as="span" variant="caption" className="text-text-sub-600">
              {period}
            </Typography>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function AlumniPage() {
  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <Typography as="h1" variant="title" className="m-0 text-title-h3 sm:text-title-h2">
            Meet Our Alumni
          </Typography>
          <Typography as="p" variant="paragraph" className="mb-0 mt-5 max-w-md text-text-sub-600">
            Meet Ilmu Komputer UGM alumni building products, leading teams, and growing careers
            across technology.
          </Typography>
        </header>
        <section aria-label="Alumni stories" className="grid content-start gap-4">
          {alumniProfiles.map((story) => (
            <AlumniStoryCard key={story.name} story={story} />
          ))}
        </section>
      </div>
    </main>
  );
}
