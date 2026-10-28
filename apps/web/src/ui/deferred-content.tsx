import { CatchBoundary } from "@tanstack/react-router";
import { Suspense, type ReactNode } from "react";
import { AlignButton } from "./button";

function DownloadError() {
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 rounded-lg bg-bg-white-0 p-4 text-text-strong-950 shadow-regular-xs sm:right-auto"
    >
      <p>Konten gagal dimuat. Periksa koneksi internet.</p>
      <AlignButton.Root className="mt-3" onClick={() => window.location.reload()}>
        Muat ulang
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
