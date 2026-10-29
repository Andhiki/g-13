import { useSharedLink } from "../../ui/use-shared-link";
import { useLocale } from "../../useLocale";
import { AlignTooltip } from "../../ui/tooltip";
import { toast, SuccessToast } from "../../ui/toast";
import { useRef } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiDriveLine,
} from "@remixicon/react";
import { AlignButton, buttonVariants } from "../../ui/button";
import { AlignModal } from "../../ui/modal";
import { Typography } from "../../ui/typography";
import { paperLinks } from "./archive";
import type { ExamPaper, ArchiveLocation } from "./contracts";
import type { RefObject } from "react";

export function PaperPreview({
  paper,
  location,
  onClose,
  list,
}: {
  paper: ExamPaper | null;
  location: ArchiveLocation;
  onClose: () => void;
  list: RefObject<HTMLDivElement | null>;
}) {
  const { text } = useLocale("exam");
  const { share, copyLink } = useSharedLink({
    selection: JSON.stringify([...location, paper?.id]),
  });
  const modalTitle = useRef<HTMLHeadingElement>(null);
  const links = paper ? paperLinks(paper) : null;
  async function sharePaper() {
    if (await copyLink())
      toast.custom(() => <SuccessToast message={text("Tautan arsip ujian disalin")} />);
  }
  return (
    <AlignModal.Root
      open={paper !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlignModal.Content
        className="flex h-[90dvh] max-w-5xl flex-col overflow-hidden"
        showClose={false}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          modalTitle.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          list.current?.focus();
        }}
      >
        <div className="flex min-w-0 items-center justify-between gap-4 p-4">
          <AlignModal.Title asChild>
            <Typography
              ref={modalTitle}
              as="h2"
              tabIndex={-1}
              variant="label"
              className="min-w-0 flex-1 truncate outline-none"
              title={paper?.name}
            >
              {paper?.name}
            </Typography>
          </AlignModal.Title>
          {links && (
            <div
              className="flex shrink-0 items-center gap-1"
              role="group"
              aria-label={text("Aksi berkas")}
            >
              <a
                href={links.download}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={text("Unduh")}
                title={text("Unduh")}
                className={buttonVariants({
                  variant: "neutral",
                  mode: "ghost",
                  size: "xsmall",
                  className: "size-8 p-0",
                })}
              >
                <RiDownloadLine className="size-4" aria-hidden="true" />
              </a>
              <AlignTooltip.Provider>
                <AlignTooltip.Root>
                  <AlignTooltip.Trigger asChild>
                    <AlignButton.Root
                      variant="neutral"
                      mode="ghost"
                      size="xsmall"
                      className="size-8 p-0"
                      aria-label={
                        share?.status === "copied"
                          ? text("Tautan berhasil disalin")
                          : text("Salin tautan")
                      }
                      onClick={() => {
                        void sharePaper();
                      }}
                    >
                      {share?.status === "copied" ? (
                        <RiCheckLine
                          key="copied"
                          className="size-4 animate-in fade-in-0 zoom-in-75 text-success-base duration-200"
                          aria-hidden="true"
                        />
                      ) : (
                        <RiFileCopyLine key="copy" className="size-4" aria-hidden="true" />
                      )}
                    </AlignButton.Root>
                  </AlignTooltip.Trigger>
                  <AlignTooltip.Content size="xsmall" side="bottom">
                    {share?.status === "copied" ? text("Tautan disalin") : text("Salin tautan")}
                  </AlignTooltip.Content>
                </AlignTooltip.Root>
              </AlignTooltip.Provider>
              <a
                href={links.drive}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={text("Buka di Drive")}
                title={text("Buka di Drive")}
                className={buttonVariants({
                  variant: "neutral",
                  mode: "ghost",
                  size: "xsmall",
                  className: "size-8 p-0",
                })}
              >
                <RiDriveLine className="size-4" aria-hidden="true" />
              </a>
              <AlignModal.Close asChild>
                <AlignButton.Root
                  variant="neutral"
                  mode="ghost"
                  size="xsmall"
                  className="size-8 p-0"
                  aria-label={text("Tutup dialog")}
                  title={text("Tutup")}
                >
                  <RiCloseLine className="size-4" aria-hidden="true" />
                </AlignButton.Root>
              </AlignModal.Close>
            </div>
          )}
          <span className="sr-only" role="status" aria-live="polite">
            {share?.status === "copied" ? text("Tautan berhasil disalin") : ""}
          </span>
        </div>
        {share?.status === "manual" && (
          <div className="border-y border-stroke-soft-200 px-4 py-2">
            <Typography variant="caption" role="status">
              {text("Gagal menyalin otomatis. Salin tautan berikut.")}
            </Typography>
            <input
              aria-label={text("Tautan berkas")}
              readOnly
              value={share.url}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-2 w-full rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-3 text-paragraph-sm"
            />
          </div>
        )}
        {paper && links && (
          <iframe
            title={paper.name}
            src={links.preview}
            className="min-h-0 w-full flex-1 border-0"
            allow="fullscreen"
          />
        )}
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
