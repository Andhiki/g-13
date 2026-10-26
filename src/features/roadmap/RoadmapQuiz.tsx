import { RiArrowLeftLine, RiCornerDownLeftLine } from "@remixicon/react";
import { Typography } from "../../ui/typography";
import { useEffect, useRef } from "react";
import { useHotkey, useHotkeys } from "@tanstack/react-hotkeys";
import { motion, useReducedMotion } from "motion/react";
import { AlignKbd } from "../../ui/kbd";
import { AlignButton } from "../../ui/button";
import { answerQuestion, firstUnanswered, quizQuestions } from "./quiz";
import { validateRoadmapSearch, type RoadmapSearch } from "./search";

export function RoadmapQuiz({
  answers,
  update,
}: {
  answers: RoadmapSearch;
  update: (next: RoadmapSearch) => void;
}) {
  const reducedMotion = useReducedMotion();
  const questions = quizQuestions(answers);
  const index = Math.max(
    0,
    questions.findIndex(
      (q) => q.key === (answers.langkah ?? firstUnanswered(answers)?.key ?? "kurikulum"),
    ),
  );
  const question = questions[index];
  const selected = answers[question.key];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [question.key]);
  const advance = () => {
    const next = questions[index + 1];
    update({ ...answers, langkah: next?.key, hasil: next ? undefined : true });
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
  useHotkeys(
    question.choices.map((choice, choiceIndex) => ({
      hotkey: { key: String(choiceIndex + 1) },
      callback: () => choose(choice.value),
    })),
    { ignoreInputs: true, requireReset: true },
  );
  useHotkey("ArrowLeft", back, {
    enabled: index > 0,
    ignoreInputs: true,
    requireReset: true,
  });
  useHotkeys(
    ["ArrowRight", "Enter"].map((key) => ({ hotkey: { key }, callback: advance })),
    { enabled: canAdvance, ignoreInputs: true, requireReset: true },
  );
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-5 pt-6 pb-28 sm:px-10 sm:py-10">
      <motion.section
        key={question.key}
        initial={reducedMotion ? false : "hidden"}
        animate="visible"
        className="my-auto py-2 sm:py-5"
        aria-labelledby="quiz-title"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <Typography
            as="h1"
            variant="question"
            id="quiz-title"
            ref={heading}
            tabIndex={-1}
            className="m-0 max-w-[680px] outline-none"
          >
            {question.title}
          </Typography>
          <Typography
            as="p"
            variant="paragraph"
            id="quiz-description"
            className="mb-8 mt-3 max-w-[650px] text-text-sub-600"
          >
            {question.description}
          </Typography>
        </motion.div>
        <motion.div
          variants={{
            hidden: {},
            visible: {
              transition: {
                delayChildren: reducedMotion ? 0 : 0.36,
                staggerChildren: reducedMotion ? 0 : 0.07,
              },
            },
          }}
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
          role="group"
          aria-label="Pilihan jawaban"
          aria-describedby="quiz-description"
        >
          {question.choices.map((choice, choiceIndex) => (
            <motion.div
              key={choice.value}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.98 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0"
            >
              <AlignButton.Root
                variant={selected === choice.value ? "primary" : "neutral"}
                mode={selected === choice.value ? "lighter" : "stroke"}
                aria-pressed={selected === choice.value}
                className="min-h-24 h-auto w-full whitespace-normal px-10 pt-10 pb-6 text-label-lg sm:min-h-32 sm:px-12 sm:pt-10 sm:pb-8"
                aria-keyshortcuts={String(choiceIndex + 1)}
                onClick={() => choose(choice.value)}
              >
                <AlignKbd.Root aria-hidden="true" className="absolute left-3 top-3">
                  {choiceIndex + 1}
                </AlignKbd.Root>
                <span>{choice.label}</span>
              </AlignButton.Root>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>
      <footer className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 border-t border-stroke-soft-200 bg-bg-white-0 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-3">
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          disabled={index === 0}
          aria-keyshortcuts="ArrowLeft"
          onClick={back}
        >
          Kembali
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
          {index === questions.length - 1 ? "Lihat roadmap" : "Lanjut"}
          <AlignKbd.Root aria-hidden="true">
            <RiCornerDownLeftLine className="size-3" />
          </AlignKbd.Root>
        </AlignButton.Root>
      </footer>
    </main>
  );
}
