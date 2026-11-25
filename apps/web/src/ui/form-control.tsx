import type { ComponentProps } from "react";
import { Input } from "@ui-sdk/react/input";
import { Textarea } from "@ui-sdk/react/textarea";
import { clsx } from "clsx";

const fieldSurface =
  "block min-h-9 w-full rounded-10 border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-text-strong-950 placeholder:text-text-sub-600 focus:border-stroke-strong-950 focus-visible:outline-2 focus-visible:outline-primary-base";

export function FormInput({
  variant = "default",
  className,
  ...props
}: ComponentProps<typeof Input> & { variant?: "default" | "bare" }) {
  return (
    <Input
      {...props}
      className={clsx("text-form-control", variant === "default" && fieldSurface, className)}
    />
  );
}

export function FormTextarea({ className, ...props }: ComponentProps<typeof Textarea>) {
  return (
    <Textarea {...props} className={clsx(fieldSurface, "text-form-control resize-y", className)} />
  );
}
