import { useState } from "react";
import { RiSearchLine } from "@remixicon/react";
import { useLocale } from "../../useLocale";
import * as Accordion from "../../ui/accordion";
import { AlignLinkButton } from "../../ui/link-button";
import { Typography } from "../../ui/typography";

const sections = [
  { id: "graduation", title: "Credits & Graduation" },
  { id: "curriculum", title: "Curriculum & Specializations" },
  { id: "thesis", title: "Thesis / Tugas Akhir (TA)" },
  { id: "transition", title: "Transition Rules (Curriculum 2021 to 2026)" },
] as const;

type SectionId = (typeof sections)[number]["id"];

const questions: { section: SectionId; question: string; answer: string }[] = [
  {
    section: "graduation",
    question: "How many SKS are needed to graduate?",
    answer:
      "You need a minimum of 144 SKS: 109 compulsory, 9–15 specialization compulsory, and 20–26 elective credits.",
  },
  {
    section: "graduation",
    question: "How long is the study period?",
    answer: "The normal duration is 4 years, with a maximum limit of 7 academic years.",
  },
  {
    section: "graduation",
    question: "How many SKS can I take per semester?",
    answer:
      "The maximum credit load depends on your previous semester's IP and can be 24, 20, 15, or 12 SKS.",
  },
  {
    section: "graduation",
    question: "What are the yudisium requirements?",
    answer:
      "Complete all required courses and the TA, earn at least 144 SKS with an IPK of at least 2.00, have no E grades, keep D grades at or below 25%, and earn at least a C in civics, religion, and KKN.",
  },
  {
    section: "graduation",
    question: "What graduation predicates are used?",
    answer:
      "The predicates include Summa Cumlaude, Magna Cumlaude, Cumlaude (with a 10-semester limit), and lower tiers.",
  },
  {
    section: "graduation",
    question: "Can I take academic leave?",
    answer:
      "Yes. You may take up to 2 semesters of leave starting from semester 5, as long as you are not currently taking your TA.",
  },
  {
    section: "graduation",
    question: "What happens if I fail a course?",
    answer:
      "You must retake a compulsory course with an E grade; the highest grade is used. Elective course cancellations are capped at 10%.",
  },
  {
    section: "graduation",
    question: "What is the fast-track option?",
    answer:
      "Students with 120 SKS can apply in semester 6, complete their S1 by semester 8, and finish the total program within a maximum of 10 semesters.",
  },
  {
    section: "graduation",
    question: "What extra requirement applies to the International Class?",
    answer:
      "Students must complete at least one international exposure activity lasting a minimum of 2 days.",
  },
  {
    section: "curriculum",
    question: "What specializations are available?",
    answer:
      "There are six: Intelligent Computing, Artificial Intelligence (AI), Computing Infrastructure, Data Analysis, Software Engineering, and Digital Entrepreneurship.",
  },
  {
    section: "curriculum",
    question: "When do I choose a specialization?",
    answer: "You must select your specialization at the start of semester 4.",
  },
  {
    section: "curriculum",
    question: "How many specialization and elective credits are required?",
    answer:
      "You need 9–15 SKS for specialization compulsory courses and 20–26 SKS for general electives.",
  },
  {
    section: "curriculum",
    question: "What is the Capstone Project?",
    answer:
      "It is a 3 SKS team-based MVP course taken in semester 5. Software Engineering Methods is a prerequisite.",
  },
  {
    section: "curriculum",
    question: "What is Kerja Praktik (internship)?",
    answer:
      "Kerja Praktik is a 4 SKS compulsory internship. From semester 6, you can add an optional 4, 8, 12, or 16 SKS internship for up to 20 SKS total.",
  },
  {
    section: "curriculum",
    question: "What about KKN?",
    answer:
      "KKN-PPM is 4 SKS. Before leaving for KKN, you must take Health Literacy, Community Communication, and Knowledge Management.",
  },
  {
    section: "curriculum",
    question: "Are MBKM activities still recognized?",
    answer:
      "Recognition is limited to internships, certifications, competitions, and student exchanges.",
  },
  {
    section: "thesis",
    question: "Is a thesis required?",
    answer: "Yes. A final project (TA) worth 9 SKS is a mandatory graduation requirement.",
  },
  {
    section: "thesis",
    question: "What are the TA stages?",
    answer: "The process has three stages: Proposal (2 SKS), Seminar (1 SKS), and TA (6 SKS).",
  },
  {
    section: "thesis",
    question: "When can I start?",
    answer:
      "You can start the proposal in semester 6. The seminar must follow at least one semester later, and you can take the TA at the same time as the seminar.",
  },
  {
    section: "thesis",
    question: "What types of TA are allowed?",
    answer:
      "You can choose an academic scientific thesis, product innovation, collaborative project, industry project, or scientific publication.",
  },
  {
    section: "thesis",
    question: "Can TA be non-skripsi?",
    answer:
      "Yes. The faculty allows publications, project-based work, prototypes, industry projects, and equivalent forms.",
  },
  {
    section: "transition",
    question: "Who does Kurikulum 2026 apply to?",
    answer:
      "It applies to the 2026 cohort onward. It is not mandatory for the 2025 cohort or earlier.",
  },
  {
    section: "transition",
    question: "Can older cohorts take 2026 courses?",
    answer:
      "Yes. All courses in the 2026 curriculum are open to all active students starting in the odd semester of the 2026/2027 academic year.",
  },
  {
    section: "transition",
    question: "What if a new compulsory course is added in 2026?",
    answer:
      "Courses that are compulsory in 2026 but were not compulsory in 2021 are not mandatory for students from the 2025 cohort and earlier.",
  },
  {
    section: "transition",
    question: "What if a 2021 compulsory course becomes an elective in 2026?",
    answer: "It is no longer mandatory for students from the 2025 cohort and earlier.",
  },
  {
    section: "transition",
    question: "What if a 2021 elective becomes compulsory in 2026?",
    answer: "It is highly recommended, but not mandatory, for students from earlier cohorts.",
  },
  {
    section: "transition",
    question: "How are Wajib Minat (specialization) courses treated for older cohorts?",
    answer:
      "Specialization courses in the 2026 curriculum are treated as standard electives for the 2025 cohort and earlier.",
  },
  {
    section: "transition",
    question: "What happens if two 2021 courses merge into one 2026 course?",
    answer:
      "You can take either the original pair of 2021 courses or the new 2026 equivalent, canceling one old course. You cannot claim all three courses.",
  },
  {
    section: "transition",
    question: "What happens if one 2021 course splits into two 2026 courses?",
    answer: "You can claim either the single 2021 course or both of the new 2026 courses.",
  },
  {
    section: "transition",
    question: "How does the Statistics transition work?",
    answer:
      "Pengantar Statistika and Probabilitas & Proses Stokastika merged into Probabilitas dan Statistika (3 SKS). Passing either old course exempts you from the new one. If you need to retake one, you must take the new 3 SKS course.",
  },
];

export function FaqPage() {
  const { text, language } = useLocale("faq");
  const [query, setQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<SectionId | "all">("all");
  const locale = language === "id" ? "id-ID" : "en";
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const localizedQuestions = questions.map((item) => ({
    ...item,
    question: text(item.question),
    answer: text(item.answer),
  }));
  const matchingGroups = sections.map((section) => ({
    ...section,
    items: localizedQuestions.filter(
      (item) =>
        item.section === section.id &&
        `${item.question} ${item.answer}`.toLocaleLowerCase(locale).includes(normalizedQuery),
    ),
  }));
  const groups = matchingGroups.filter(
    (section) =>
      section.items.length > 0 && (selectedSection === "all" || section.id === selectedSection),
  );
  const searchResultCount = matchingGroups.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  const resultCount = groups.reduce((count, section) => count + section.items.length, 0);

  return (
    <main className="min-h-[calc(100dvh-var(--app-header-height))] bg-bg-white-0 px-5 py-10 text-text-strong-950 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
        <header className="lg:sticky lg:top-28 lg:self-start">
          <Typography as="h1" variant="title" className="m-0 text-title-h3 sm:text-title-h2">
            {text("FAQ")}
          </Typography>
          <Typography as="p" variant="paragraph" className="mb-0 mt-5 max-w-md text-text-sub-600">
            {text(
              "Find answers about study requirements, specializations, final projects, and curriculum transitions.",
            )}
          </Typography>
        </header>

        <section aria-label={text("FAQ")} className="grid content-start">
          <label className="relative block">
            <span className="sr-only">{text("Search questions and answers")}</span>
            <RiSearchLine
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-soft-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={text("Search questions and answers")}
              className="h-12 w-full rounded-xl border border-stroke-soft-200 bg-bg-white-0 pl-12 pr-4 text-paragraph-sm text-text-strong-950 outline-none placeholder:text-text-soft-400 focus-visible:border-primary-base focus-visible:ring-2 focus-visible:ring-primary-alpha-10"
            />
          </label>

          <div className="mt-6 border-y border-stroke-soft-200 py-4">
            <Typography as="p" variant="label" className="mb-3 mt-0 text-text-sub-600">
              {text("Filter by topic")}
            </Typography>
            <div
              role="group"
              aria-label={text("FAQ topic filters")}
              className="flex flex-wrap gap-2"
            >
              <AlignLinkButton.Root
                type="button"
                variant={selectedSection === "all" ? "primary" : "gray"}
                underline={selectedSection === "all"}
                aria-pressed={selectedSection === "all"}
                onClick={() => setSelectedSection("all")}
                className="h-auto min-h-10 justify-between gap-2 rounded-md border border-stroke-soft-200 px-3 py-2 text-left whitespace-normal"
              >
                <Typography as="span" variant="labelSmall">
                  {text("All topics")}
                </Typography>
                <Typography as="span" variant="caption" className="text-text-soft-400">
                  {searchResultCount.toString().padStart(2, "0")}
                </Typography>
              </AlignLinkButton.Root>
              {matchingGroups.map((section) => (
                <AlignLinkButton.Root
                  key={section.id}
                  type="button"
                  variant={selectedSection === section.id ? "primary" : "gray"}
                  underline={selectedSection === section.id}
                  aria-pressed={selectedSection === section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className="h-auto min-h-10 justify-between gap-2 rounded-md border border-stroke-soft-200 px-3 py-2 text-left whitespace-normal"
                >
                  <Typography as="span" variant="labelSmall">
                    {text(section.title)}
                  </Typography>
                  <Typography as="span" variant="caption" className="text-text-soft-400">
                    {section.items.length.toString().padStart(2, "0")}
                  </Typography>
                </AlignLinkButton.Root>
              ))}
            </div>
          </div>

          <Typography as="p" variant="caption" className="mb-0 mt-4 text-text-soft-400">
            {text("Use the latest official program guidance for academic decisions.")}
          </Typography>
          <Typography
            as="p"
            variant="caption"
            aria-live="polite"
            className="mb-0 mt-3 text-text-soft-400"
          >
            {text("Showing {{count}} answers", { count: resultCount })}
          </Typography>

          {groups.length ? (
            <div className="mt-7 space-y-9">
              {groups.map((section) => (
                <section
                  key={section.id}
                  aria-label={text(section.title)}
                  className="border-t border-stroke-soft-200 pt-5"
                >
                  <Typography as="h2" variant="subtitle1" className="m-0 text-text-strong-950">
                    {text(section.title)}
                  </Typography>
                  <Accordion.Root
                    type="single"
                    collapsible
                    className="mt-2 divide-y divide-stroke-soft-200"
                  >
                    {section.items.map((item) => (
                      <Accordion.Item key={item.question} value={item.question}>
                        <Accordion.Header>
                          <Accordion.Trigger>
                            {item.question}
                            <Accordion.Arrow aria-hidden="true" className="shrink-0" />
                          </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="max-w-3xl pb-4 leading-relaxed">
                          {item.answer}
                        </Accordion.Content>
                      </Accordion.Item>
                    ))}
                  </Accordion.Root>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-xl border border-dashed border-stroke-soft-200 px-5 py-8 text-center">
              <Typography as="p" variant="subtitle2" className="m-0 text-text-strong-950">
                {text("No matching questions")}
              </Typography>
              <Typography as="p" variant="paragraph" className="mb-0 mt-2 text-text-sub-600">
                {text("Try a different word or clear your search.")}
              </Typography>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
