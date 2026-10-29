import { Typography } from "./typography";
import { useLocale } from "../useLocale";
import { CatchBoundary } from "@tanstack/react-router";
import { Suspense, type ReactNode } from "react";
import { AlignButton } from "./button";

function DownloadError() {
  const { text } = useLocale("common");
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 rounded-lg bg-bg-white-0 p-4 text-text-strong-950 shadow-regular-xs sm:right-auto"
    >
      <Typography>{text("Konten gagal dimuat. Periksa koneksi internet.")}</Typography>
      <AlignButton.Root className="mt-3" onClick={() => window.location.reload()}>
        {text("Muat ulang")}
      </AlignButton.Root>
    </div>
  );
}

export function DeferredContent({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  return (
    <CatchBoundary getResetKey={() => 0} errorComponent={DownloadError}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </CatchBoundary>
  );
}
