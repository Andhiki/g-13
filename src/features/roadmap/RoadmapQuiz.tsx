import { useEffect, useRef } from "react";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
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
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-5 py-6 sm:px-10 sm:py-10">
      <div className="mb-8 flex items-center justify-between text-paragraph-sm text-text-sub-600">
        <span>Roadmap kuliah</span>
        <span aria-live="polite">
          Pertanyaan {index + 1} dari {questions.length}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Progres kuis"
        aria-valuenow={index + 1}
        aria-valuemin={0}
        aria-valuemax={questions.length}
        className="mb-10 h-1 overflow-hidden rounded-full bg-bg-soft-200"
      >
        <div
          className="h-full bg-text-strong-950 transition-[width] motion-reduce:transition-none"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>
      <section className="my-auto py-2 sm:py-5" aria-labelledby="quiz-title">
        <h1
          id="quiz-title"
          ref={heading}
          tabIndex={-1}
          className="m-0 max-w-[680px] text-[26px] font-semibold leading-tight tracking-[-0.03em] outline-none sm:text-[32px]"
        >
          {question.title}
        </h1>
        <p
          id="quiz-description"
          className="mb-8 mt-3 max-w-[650px] text-paragraph-sm text-text-sub-600"
        >
          {question.description}
        </p>
        <fieldset
          className="m-0 grid min-w-0 grid-cols-1 gap-3 border-0 p-0 sm:grid-cols-2"
          aria-describedby="quiz-description"
        >
          <legend className="sr-only">{question.title}</legend>
          {question.choices.map((choice) => (
            <label
              key={choice.value}
              className="group relative flex cursor-pointer items-start gap-4 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-5 transition-colors hover:bg-bg-weak-50 has-[:checked]:border-text-strong-950 has-[:checked]:bg-bg-weak-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-primary-base"
            >
              <input
                type="radio"
                name={question.key}
                value={choice.value}
                checked={selected === choice.value}
                onChange={() =>
                  update(
                    validateRoadmapSearch({
                      ...answerQuestion(answers, question.key, choice.value),
                      langkah: question.key,
                    }),
                  )
                }
                className="mt-1 size-4 shrink-0 accent-text-strong-950"
              />
              <span className="min-w-0">
                <span className="block text-label-md">{choice.label}</span>
                <span className="mt-1 block text-paragraph-sm text-text-sub-600">
                  {choice.detail}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </section>
      <footer className="mt-10 flex items-center justify-between gap-4 pb-3 pt-4">
        <AlignButton.Root
          variant="neutral"
          mode="ghost"
          disabled={index === 0}
          onClick={() => update({ ...answers, langkah: questions[index - 1].key })}
        >
          <RiArrowLeftLine className="size-5" aria-hidden="true" /> Kembali
        </AlignButton.Root>
        <AlignButton.Root
          variant="neutral"
          mode="filled"
          disabled={!question.choices.some((x) => x.value === selected)}
          onClick={advance}
        >
          {index === questions.length - 1 ? "Lihat roadmap" : "Lanjut"}{" "}
          <RiArrowRightLine className="size-5" aria-hidden="true" />
        </AlignButton.Root>
      </footer>
    </main>
  );
}
