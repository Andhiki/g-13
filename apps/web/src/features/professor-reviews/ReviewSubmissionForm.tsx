import { AlignSelect } from "../../ui/select";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useLocale } from "../../useLocale";
import { AlignButton } from "../../ui/button";
import { courseDisplayName, matchesCourseSearch } from "./course-search";
import { publishProfessorReview } from "./server";

type Data = Awaited<ReturnType<typeof import("./repository").getPublicProfessorReviews>>;
const control =
  "mt-1 block w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-3 text-paragraph-sm focus-visible:outline-2 focus-visible:outline-primary-base";
export function ReviewSubmissionForm({ data }: { data: Data }) {
  const { text, language } = useLocale("professors");
  const router = useRouter();
  const [anonymous, setAnonymous] = useState(true);
  const [query, setQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <details className="mt-8 rounded-10 border border-stroke-soft-200 p-5 sm:p-6">
      <summary className="cursor-pointer text-label-md">{text("Write a review")}</summary>
      <form
        key={revision}
        className="mt-5 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          setPending(true);
          setMessage("");
          try {
            const result = await publishProfessorReview({
              data: {
                professorId: values.get("professorId"),
                courseId,
                termLabel: values.get("termLabel"),
                anonymous,
                authorName: values.get("authorName") ?? "",
                body: values.get("body"),
                clarity: Number(values.get("clarity")),
                support: Number(values.get("support")),
                organization: Number(values.get("organization")),
              },
            });
            if (!result.ok) {
              setMessage(
                result.error === "rate-limit"
                  ? "Submission limit reached. Try again next hour."
                  : result.error === "invalid"
                    ? "Check all fields and select a professor and course."
                    : "Reviews are temporarily unavailable. Please try again later.",
              );
              return;
            }
            form.reset();
            setRevision((n) => n + 1);
            setAnonymous(true);
            setCourseId("");
            setQuery("");
            setMessage("Your review is published.");
            await router.invalidate();
          } catch {
            setMessage("Could not confirm publication. Refresh the page before trying again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <p className="text-paragraph-sm text-text-sub-600">
          {text(
            "Reviews publish immediately and are unverified. Do not include personal information in your name or review. Anonymous hides your display name, but does not guarantee anonymity from infrastructure operators.",
          )}
        </p>
        <p className="text-paragraph-xs text-text-sub-600">
          {text(
            "Limit: 3 submissions per IP per hour. A keyed IP hash is kept until the hour ends and removed on a later submission; raw IPs are not stored in reviews.",
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            {text("Professor")}
            <AlignSelect.Root name="professorId" required defaultValue="">
              <AlignSelect.Trigger className="mt-1" aria-label={text("Select a professor")}>
                <AlignSelect.Value placeholder={text("Select a professor")} />
              </AlignSelect.Trigger>
              <AlignSelect.Content>
                {data.professors.map((p) => (
                  <AlignSelect.Item key={p.id} value={p.id}>
                    {p.name}
                  </AlignSelect.Item>
                ))}
              </AlignSelect.Content>
            </AlignSelect.Root>
          </label>
          <div>
            <label>
              {text("Search courses")}
              <input
                className={control}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={text("Search by course code or name")}
              />
            </label>
            <label className="mt-2 block">
              {text("Course")}
              <AlignSelect.Root
                required

                value={courseId}
                onValueChange={setCourseId}
              >
                <AlignSelect.Trigger className="mt-1" aria-label={text("Select a course")}>
                  <AlignSelect.Value placeholder={text("Select a course")} />
                </AlignSelect.Trigger>
                <AlignSelect.Content>
                  {data.courses
                    .filter((c) => c.id === courseId || matchesCourseSearch(c, query))
                    .map((c) => (
                      <AlignSelect.Item key={c.id} value={c.id}>
                        {c.code} · {courseDisplayName(c, language)}
                      </AlignSelect.Item>
                    ))}
                </AlignSelect.Content>
              </AlignSelect.Root>
            </label>
          </div>
        </div>
        <label className="block">
          {text("Term (1–60 characters, e.g. 2026/2027 Ganjil)")}
          <input className={control} name="termLabel" required maxLength={60} />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          {text("Publish as Anonymous")}
        </label>
        {!anonymous && (
          <label className="block">
            {text("Display name (1–80 characters)")}
            <input className={control} name="authorName" required maxLength={80} />
          </label>
        )}
        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-2">{text("Ratings: 1 (lowest) to 5 (highest)")}</legend>
          {["Clarity", "Support", "Organization"].map((metric) => (
            <label key={metric}>
              {text(metric)}
              <AlignSelect.Root name={metric.toLowerCase()} required defaultValue="">
                <AlignSelect.Trigger className="mt-1" aria-label={text("Select a rating")}>
                  <AlignSelect.Value placeholder={text("Select a rating")} />
                </AlignSelect.Trigger>
                <AlignSelect.Content>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <AlignSelect.Item key={n} value={String(n)}>
                      {n}
                    </AlignSelect.Item>
                  ))}
                </AlignSelect.Content>
              </AlignSelect.Root>
            </label>
          ))}
        </fieldset>
        <label className="block">
          {text("Your experience (1–1,000 characters)")}
          <textarea className={control} name="body" required maxLength={1000} rows={4} />
        </label>
        <p role="status" aria-live="polite" className="text-paragraph-sm">
          {text(message)}
        </p>
        <AlignButton.Root
          type="submit"
          disabled={pending || !data.professors.length || !data.courses.length}
        >
          {text(pending ? "Publishing…" : "Publish review")}
        </AlignButton.Root>
      </form>
    </details>
  );
}
