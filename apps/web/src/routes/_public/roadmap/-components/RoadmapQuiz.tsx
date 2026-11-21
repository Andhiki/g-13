import { useLocale } from "@/useLocale";
import { RiArrowLeftLine, RiCornerDownLeftLine } from "@remixicon/react";
import { Typography } from "@/ui/typography";
import { useEffect, useRef } from "react";
import { useKeyboardShortcuts } from "@/ui/use-keyboard-shortcuts";
import { m, useReducedMotion } from "motion/react";
import { AlignKbd } from "@/ui/kbd";
import { AlignButton } from "@/ui/button";
import { answerQuestion, questionIndex, quizQuestions } from "../-shared/quiz";
import { validateRoadmapSearch, type RoadmapSearch } from "../-shared/search";
import { noteRoadmapCreated } from "@/ui/star-nudge";
import { showStarNudgeToast } from "@/ui/star-nudge-toast";

export function RoadmapQuiz({
  answers,
  update,
}: {
  answers: RoadmapSearch;
  update: (next: RoadmapSearch) => void;
}) {
  const { text } = useLocale("roadmap");
  const { text: commonText } = useLocale();
  const reducedMotion = useReducedMotion();
  const questions = quizQuestions(answers);
  const index = questionIndex(questions, answers);
  const question = questions[index];
  const selected = answers[question.key];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [question.key]);
  const advance = () => {
    const next = questions[index + 1];
    update({ ...answers, langkah: next?.key, hasil: next ? undefined : true });
    if (!next && noteRoadmapCreated()) showStarNudgeToast(commonText);
  };
  const choose = (value: string) =>
    update(
      validateRoadmapSearch({
        ...answerQuestion(answers, question.key, value),
        langkah: question.key,
      }),
    );
  const back = () => update({ ...answers, langkah: questions[index - 1].key });
  const canAdvance = question.choices.some((choice) => choice.value === selected);
  useKeyboardShortcuts({
    ...Object.fromEntries(
      question.choices.map((choice, index) => [String(index + 1), () => choose(choice.value)]),
    ),
    ...(index > 0 ? { arrowleft: back } : {}),
    ...(canAdvance ? { arrowright: advance, enter: advance } : {}),
  });
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-5 pt-6 pb-28 sm:px-10 sm:py-10">
      <m.section
        key={question.key}
        initial={reducedMotion ? false : "hidden"}
        animate="visible"
        className="my-auto py-2 sm:py-5"
        aria-labelledby="quiz-title"
      >
        <m.div
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Typography
            as="h1"
            variant="question"
            id="quiz-title"
            ref={heading}
            tabIndex={-1}
            className={
              // oxlint-disable-next-line shadcn/no-restyle -- programmatic focus target; keyboard focus is shown by the quiz choice and footer buttons
              "m-0 max-w-[680px] outline-none"
            }
          >
            {text(question.title)}
          </Typography>
          <Typography
            as="p"
            variant="paragraph"
            color="muted"
            id="quiz-description"
            className="mb-8 mt-3 max-w-[650px]"
          >
            {text(question.description)}
          </Typography>
        </m.div>
        <m.div
          variants={{
            hidden: {},
            visible: {
              transition: {
                delayChildren: 0,
                staggerChildren: reducedMotion ? 0 : 0.03,
              },
            },
          }}
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
          role="group"
          aria-label={text("Pilihan jawaban")}
          aria-describedby="quiz-description"
        >
          {question.choices.map((choice, choiceIndex) => (
            <m.div
              key={choice.value}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.98 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0"
            >
              <AlignButton.Root
                variant={selected === choice.value ? "primary" : "neutral"}
                mode={selected === choice.value ? "lighter" : "stroke"}
                aria-pressed={selected === choice.value}
                className={
                  // oxlint-disable-next-line shadcn/no-restyle -- quiz choice card: bare p-0 button — the card's padding and text sizing live on the inner wrapper so the ring traces the card box
                  "min-h-24 h-auto w-full whitespace-normal p-0 sm:min-h-32"
                }
                aria-keyshortcuts={String(choiceIndex + 1)}
                onClick={() => choose(choice.value)}
              >
                <AlignKbd.Root aria-hidden="true" className="absolute left-3 top-3">
                  {choiceIndex + 1}
                </AlignKbd.Root>
                <span className="px-10 py-8 text-text-strong-950 text-label-sm sm:px-12">
                  {text(choice.label)}
                </span>
              </AlignButton.Root>
            </m.div>
          ))}
        </m.div>
      </m.section>
      <footer className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t border-stroke-soft-200 bg-bg-white-0 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-3">
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          disabled={index === 0}
          aria-keyshortcuts="ArrowLeft"
          onClick={back}
        >
          {text("Kembali")}
          <AlignKbd.Root aria-hidden="true">
            <RiArrowLeftLine className="size-3" />
          </AlignKbd.Root>
        </AlignButton.Root>
        <AlignButton.Root
          variant="neutral"
          mode="filled"
          disabled={!canAdvance}
          aria-keyshortcuts="ArrowRight Enter"
          onClick={advance}
        >
          {index === questions.length - 1 ? text("Lihat roadmap") : text("Lanjut")}
          <AlignKbd.Root aria-hidden="true">
            <RiCornerDownLeftLine className="size-3" />
          </AlignKbd.Root>
        </AlignButton.Root>
      </footer>
    </main>
  );
}
