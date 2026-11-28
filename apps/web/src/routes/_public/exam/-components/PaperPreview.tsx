import { useSharedLink } from "@/ui/use-shared-link";
import { useLocale } from "@/useLocale";
import { AlignTooltip } from "@/ui/tooltip";
import { toast, SuccessToast } from "@/ui/toast";
import { useRef } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiDriveLine,
} from "@remixicon/react";
import { AlignButton, buttonVariants } from "@/ui/button";
import { AlignModal } from "@/ui/modal";
import { Typography } from "@/ui/typography";
import { paperLinks } from "../-shared/archive";
import type { ExamPaper, ArchiveLocation } from "../-shared/contracts";
import type { RefObject } from "react";

function PaperShareButton({ copied, onShare }: { copied: boolean; onShare: () => void }) {
  const { text } = useLocale("exam");
  return (
    <AlignTooltip.Provider>
      <AlignTooltip.Root>
        <AlignTooltip.Trigger asChild>
          <AlignButton.Root
            variant="neutral"
            mode="stroke"
            size="xsmall"
            iconOnly
            className={
              // oxlint-disable-next-line shadcn/no-restyle -- copy-link press feedback: a deliberate quick transform scale with its own timing
              "transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.98]"
            }
            aria-label={copied ? text("Tautan berhasil disalin") : text("Salin tautan")}
            onClick={onShare}
          >
            {copied ? (
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
          {copied ? text("Tautan disalin") : text("Salin tautan")}
        </AlignTooltip.Content>
      </AlignTooltip.Root>
    </AlignTooltip.Provider>
  );
}

function PaperPreviewActions({
  links,
  copied,
  onShare,
}: {
  links: ReturnType<typeof paperLinks>;
  copied: boolean;
  onShare: () => void;
}) {
  const { text } = useLocale("exam");
  const iconButton = buttonVariants({
    variant: "neutral",
    mode: "stroke",
    size: "xsmall",
    iconOnly: true,
  });
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={text("Aksi berkas")}>
      <a
        href={links.download}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={text("Unduh")}
        title={text("Unduh")}
        className={iconButton}
      >
        <RiDownloadLine className="size-4" aria-hidden="true" />
      </a>
      <PaperShareButton copied={copied} onShare={onShare} />
      <a
        href={links.drive}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={text("Buka di Drive")}
        title={text("Buka di Drive")}
        className={iconButton}
      >
        <RiDriveLine className="size-4" aria-hidden="true" />
      </a>
      <AlignModal.Close asChild>
        <AlignButton.Root
          variant="neutral"
          mode="stroke"
          size="xsmall"
          iconOnly
          aria-label={text("Tutup dialog")}
          title={text("Tutup")}
        >
          <RiCloseLine className="size-4" aria-hidden="true" />
        </AlignButton.Root>
      </AlignModal.Close>
    </div>
  );
}

function PaperPreviewHeader({
  paperName,
  modalTitle,
  links,
  copied,
  onShare,
}: {
  paperName?: string;
  modalTitle: RefObject<HTMLHeadingElement | null>;
  links: ReturnType<typeof paperLinks> | null;
  copied: boolean;
  onShare: () => void;
}) {
  const { text } = useLocale("exam");
  return (
    <AlignModal.Header className="flex min-w-0 items-center justify-between gap-4 p-4">
      <AlignModal.Title asChild>
        <Typography
          ref={modalTitle}
          as="h2"
          tabIndex={-1}
          variant="label"
          className={
            // oxlint-disable-next-line shadcn/no-restyle -- programmatic focus target; keyboard focus is shown by the modal's toolbar buttons
            "min-w-0 flex-1 truncate outline-none"
          }
          title={paperName}
        >
          {paperName}
        </Typography>
      </AlignModal.Title>
      {links && <PaperPreviewActions links={links} copied={copied} onShare={onShare} />}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? text("Tautan berhasil disalin") : ""}
      </span>
    </AlignModal.Header>
  );
}

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
  const previousFocus = useRef<HTMLElement | null>(null);
  const links = paper ? paperLinks(paper) : null;
  async function sharePaper() {
    if (await copyLink())
      toast.custom(() => <SuccessToast message={text("Tautan arsip ujian disalin")} />);
  }
  return (
    <AlignModal.Root
      presentation="dialog"
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
          previousFocus.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          modalTitle.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (previousFocus.current?.isConnected) previousFocus.current.focus();
          else list.current?.focus();
        }}
      >
        <PaperPreviewHeader
          paperName={paper?.name}
          modalTitle={modalTitle}
          links={links}
          copied={share?.status === "copied"}
          onShare={() => {
            void sharePaper();
          }}
        />
        {share?.status === "manual" && (
          <div className="shrink-0 border-b border-stroke-soft-200 px-4 py-2">
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
