import { useLocale } from "@/useLocale";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";

export function ThesesUnavailable() {
  const { text } = useLocale("theses");
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-10 bg-bg-weak-50 p-6">
      <Typography variant="label" className="m-0">
        {text("The thesis directory is temporarily unavailable.")}
      </Typography>
      <AlignButton.Root size="small" onClick={() => window.location.reload()}>
        {text("Try again")}
      </AlignButton.Root>
    </div>
  );
}
