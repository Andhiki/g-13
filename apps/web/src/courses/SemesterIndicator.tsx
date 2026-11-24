import { Typography } from "../ui/typography";
import { useLocale } from "../useLocale";
export function SemesterIndicator({ label }: { label: string }) {
  const { text } = useLocale();
  const match = /^Semester ([1-8])$/.exec(label);
  if (!match)
    return (
      <Typography variant="label" className="m-0 mt-2 text-text-strong-950">
        {text(label)}
      </Typography>
    );
  const recommended = Number(match[1]);

  return (
    <div role="img" aria-label={text("recommendedSemester", { semester: recommended })}>
      <div
        aria-hidden="true"
        className="relative mt-3 grid grid-cols-8 pt-10 before:absolute before:inset-x-[6.25%] before:top-[45px] before:h-px before:bg-stroke-sub-300"
      >
        {Array.from({ length: 8 }, (_, index) => {
          const semester = index + 1;
          const selected = semester === recommended;
          return (
            <div key={semester} className="relative flex flex-col items-center gap-3">
              {selected && (
                <>
                  <Typography
                    as="span"
                    variant="labelSmall"
                    className={`absolute -top-10 whitespace-nowrap rounded-4 bg-bg-strong-950 px-2 py-1 text-text-white-0 ${index === 0 ? "left-0" : index === 7 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                  >
                    {text("Semester")} {semester}
                  </Typography>
                  <span className="absolute -top-5 size-2 rotate-45 bg-bg-strong-950" />
                </>
              )}
              <span
                className={`relative size-[10px] rounded-full border-2 ${selected ? "border-bg-strong-950 bg-bg-strong-950" : "border-stroke-sub-300 bg-bg-white-0"}`}
              />
              <Typography
                as="span"
                variant="labelSmall"
                className={`tabular-nums ${selected ? "text-text-strong-950" : "text-text-sub-600"}`}
              >
                {semester}
              </Typography>
            </div>
          );
        })}
      </div>
    </div>
  );
}
