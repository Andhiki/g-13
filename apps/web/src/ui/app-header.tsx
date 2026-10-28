import { Link } from "@tanstack/react-router";
import { defaultCurriculumId } from "@g13/curriculum";
import { Image } from "@unpic/react";
import { Faq } from "./faq";
import { ThemeSwitch } from "./theme-switch";
import { AlignButton } from "./button";
import { AlignLinkButton } from "./link-button";

function BrandLogo() {
  return (
    <Link
      to="/"
      search={{ kurikulum: defaultCurriculumId }}
      aria-label="OmahTI — beranda"
      className="pointer-events-auto flex h-10 w-fit shrink-0 items-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-base"
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
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[var(--app-header-height)] items-center gap-1 border-b border-stroke-soft-200 bg-bg-white-0 px-1.5 text-text-strong-950 sm:gap-6 sm:px-6">
      <div className="flex shrink-0 items-center gap-1 sm:gap-4">
        <BrandLogo />
        <Link
          to="/"
          search={{ kurikulum: defaultCurriculumId }}
          aria-label="HIMAKOM UGM — beranda"
          className="flex h-10 shrink-0 items-center rounded"
        >
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
      </div>
      <nav aria-label="Navigasi aplikasi" className="flex items-center gap-2 sm:gap-5">
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
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
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
    </header>
  );
}
