import { useEffect, useState } from "react";
import { RiMenuLine, RiCloseLine } from "@remixicon/react";
import { AlignModal } from "./modal";
import { Link } from "@tanstack/react-router";
import { defaultCurriculumId } from "@g13/curriculum";
import { Image } from "@unpic/react";
import { Faq } from "./faq";
import { ThemeSwitch } from "./theme-switch";
import { AlignButton } from "./button";
import { AlignLinkButton } from "./link-button";

function BrandLogo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      onClick={onClick}
      to="/"
      search={{ kurikulum: defaultCurriculumId }}
      aria-label="OmahTI dan HIMAKOM UGM — beranda"
      className="pointer-events-auto flex h-10 w-fit shrink-0 items-center gap-1 rounded sm:gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-base"
    >
      <Image
        src="/brand/omahti-light.svg"
        alt="OmahTI"
        layout="fixed"
        width={54}
        height={21}
        className="dark:hidden"
      />
      <Image
        src="/brand/omahti-dark.svg"
        alt="OmahTI"
        layout="fixed"
        width={54}
        height={21}
        className="hidden dark:block"
      />

      <Image
        src="/brand/himakom-light.png"
        alt="HIMAKOM UGM"
        layout="fixed"
        width={25}
        height={32}
        className="object-contain dark:hidden"
      />
      <Image
        src="/brand/himakom-dark.png"
        alt="HIMAKOM UGM"
        layout="fixed"
        width={25}
        height={32}
        className="hidden object-contain dark:block"
      />
    </Link>
  );
}

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <AlignModal.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <header className="fixed inset-x-0 top-0 z-40 flex h-[var(--app-header-height)] items-center gap-1 border-b border-stroke-soft-200 bg-bg-white-0 px-4 text-text-strong-950 sm:gap-6 sm:px-6">
        <BrandLogo />
        <nav aria-label="Navigasi aplikasi" className="hidden items-center gap-5 sm:flex">
          <AlignLinkButton.Root asChild>
            <Link
              to="/exam"
              activeProps={{
                className: "decoration-current",
                "aria-current": "page",
              }}
            >
              Arsip Ujian
            </Link>
          </AlignLinkButton.Root>
          <Faq />
        </nav>
        <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
          <ThemeSwitch />
          <AlignButton.Root
            asChild
            variant="neutral-inverse"
            mode="filled"
            size="small"
            className="px-2 sm:px-3"
          >
            <Link to="/roadmap" search={{ lulus: 8, semesterPaparan: 6 }}>
              Roadmap
            </Link>
          </AlignButton.Root>
        </div>
        <AlignModal.Trigger asChild>
          <AlignButton.Root
            variant="neutral"
            mode="ghost"
            className="ml-auto size-11 p-2.5 sm:hidden"
            aria-label="Buka navigasi"
          >
            <RiMenuLine aria-hidden="true" className="size-6" />
          </AlignButton.Root>
        </AlignModal.Trigger>
      </header>
      <AlignModal.Content
        showClose={false}
        aria-describedby={undefined}
        overlayClassName="bg-transparent p-0 backdrop-blur-none sm:hidden"
        className="fixed inset-0 flex h-dvh max-w-none flex-col overflow-y-auto rounded-none text-text-strong-950 shadow-none data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 motion-reduce:animate-none"
      >
        <AlignModal.Title className="sr-only">Navigasi aplikasi</AlignModal.Title>
        <div className="flex h-[var(--app-header-height)] shrink-0 items-center justify-between border-b border-stroke-soft-200 px-4">
          <BrandLogo onClick={() => setMenuOpen(false)} />
          <AlignModal.Close asChild>
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              className="size-11 p-2.5"
              aria-label="Tutup navigasi"
            >
              <RiCloseLine aria-hidden="true" className="size-6" />
            </AlignButton.Root>
          </AlignModal.Close>
        </div>
        <nav
          aria-label="Navigasi seluler"
          className="flex flex-col divide-y divide-stroke-soft-200 px-6"
        >
          <AlignLinkButton.Root asChild className="h-14 justify-start text-lg">
            <Link
              to="/"
              search={{ kurikulum: defaultCurriculumId }}
              onClick={() => setMenuOpen(false)}
              activeProps={{ "aria-current": "page", className: "decoration-current" }}
            >
              Kurikulum
            </Link>
          </AlignLinkButton.Root>
          <AlignLinkButton.Root asChild className="h-14 justify-start text-lg">
            <Link
              to="/exam"
              onClick={() => setMenuOpen(false)}
              activeProps={{ "aria-current": "page", className: "decoration-current" }}
            >
              Arsip Ujian
            </Link>
          </AlignLinkButton.Root>
          <AlignLinkButton.Root asChild className="h-14 justify-start text-lg">
            <Link
              to="/roadmap"
              search={{ lulus: 8, semesterPaparan: 6 }}
              onClick={() => setMenuOpen(false)}
              activeProps={{ "aria-current": "page", className: "decoration-current" }}
            >
              Roadmap
            </Link>
          </AlignLinkButton.Root>
          <Faq className="h-14 justify-start text-lg" />
        </nav>
        <div className="mx-6 mt-auto flex justify-end border-t border-stroke-soft-200 py-5">
          <ThemeSwitch />
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
