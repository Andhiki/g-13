import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { RiGithubFill, RiRouteLine } from "@remixicon/react";
import { AlignModal } from "./modal";
import { Link } from "@tanstack/react-router";
import { defaultCurriculumId } from "@g13/curriculum";
import { Image } from "@unpic/react";
import { Faq } from "./faq";
import { ThemeSwitch } from "./theme-switch";
import { AlignButton } from "./button";
import { AlignLinkButton } from "./link-button";
import { LanguageSwitch } from "./language-switch";
import { useTranslation } from "react-i18next";

function MenuIcon({ open }: { open: boolean }) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.3, bounce: 0 };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <m.line
        x1="4"
        y1="7"
        x2="20"
        y2="7"
        animate={open ? { x1: 6, y1: 6, x2: 18, y2: 18 } : { x1: 4, y1: 7, x2: 20, y2: 7 }}
        transition={transition}
      />
      <m.line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        animate={open ? { x1: 12, x2: 12, opacity: 0 } : { x1: 4, x2: 20, opacity: 1 }}
        transition={transition}
      />
      <m.line
        x1="4"
        y1="17"
        x2="20"
        y2="17"
        animate={open ? { x1: 18, y1: 6, x2: 6, y2: 18 } : { x1: 4, y1: 17, x2: 20, y2: 17 }}
        transition={transition}
      />
    </svg>
  );
}

function BrandLogo({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <Link
      onClick={onClick}
      to="/"
      search={{ kurikulum: defaultCurriculumId }}
      aria-label={t("navigation.home")}
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

function GitHubButton() {
  const { t } = useTranslation();
  return (
    <AlignButton.Root asChild variant="neutral" mode="stroke" className="size-10 p-2.5">
      <a
        href="https://github.com/Andhiki/g-13"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("navigation.github")}
        title="GitHub"
      >
        <RiGithubFill aria-hidden="true" className="size-5" />
      </a>
    </AlignButton.Root>
  );
}

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

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
        <nav aria-label={t("navigation.label")} className="hidden items-center gap-5 sm:flex">
          <AlignLinkButton.Root asChild>
            <Link
              to="/exam"
              activeProps={{
                className: "decoration-current",
                "aria-current": "page",
              }}
            >
              {t("navigation.examArchive")}
            </Link>
          </AlignLinkButton.Root>
          <AlignLinkButton.Root asChild>
            <Link
              to="/alumni"
              activeProps={{
                className: "decoration-current",
                "aria-current": "page",
              }}
            >
              {t("navigation.alumni")}
            </Link>
          </AlignLinkButton.Root>
          <AlignLinkButton.Root asChild>
            <Link
              to="/resources"
              activeProps={{
                className: "decoration-current",
                "aria-current": "page",
              }}
            >
              {t("navigation.resources")}
            </Link>
          </AlignLinkButton.Root>
          <Faq />
        </nav>
        <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
          <GitHubButton />
          <LanguageSwitch />
          <ThemeSwitch />
          <AlignButton.Root
            asChild
            variant="neutral-inverse"
            mode="filled"
            size="small"
            className="px-2 sm:px-3"
          >
            <Link to="/roadmap" search={{ lulus: 8, semesterPaparan: 6 }}>
              <RiRouteLine aria-hidden="true" className="size-4" />
              {t("navigation.roadmap")}
            </Link>
          </AlignButton.Root>
        </div>
        <AlignModal.Trigger asChild>
          <AlignButton.Root
            variant="neutral"
            mode="ghost"
            className="ml-auto size-11 p-2.5 sm:hidden"
            aria-label={menuOpen ? t("navigation.close") : t("navigation.open")}
            aria-expanded={menuOpen}
          >
            <MenuIcon open={menuOpen} />
          </AlignButton.Root>
        </AlignModal.Trigger>
      </header>
      <AlignModal.Content
        showClose={false}
        aria-describedby={undefined}
        overlayClassName="bg-transparent p-0 backdrop-blur-none sm:hidden"
        className="fixed inset-0 flex h-dvh max-w-none flex-col overflow-y-auto rounded-none text-text-strong-950 shadow-none data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 motion-reduce:animate-none"
      >
        <AlignModal.Title className="sr-only">{t("navigation.label")}</AlignModal.Title>
        <div className="flex h-[var(--app-header-height)] shrink-0 items-center justify-between border-b border-stroke-soft-200 px-4">
          <BrandLogo onClick={() => setMenuOpen(false)} />
          <AlignModal.Close asChild>
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              className="size-11 p-2.5"
              aria-label={t("navigation.close")}
            >
              <MenuIcon open={menuOpen} />
            </AlignButton.Root>
          </AlignModal.Close>
        </div>
        <nav
          aria-label={t("navigation.mobileLabel")}
          className="flex flex-col divide-y divide-stroke-soft-200 px-6"
        >
          <AlignLinkButton.Root asChild className="h-14 justify-start text-lg">
            <Link
              to="/"
              search={{ kurikulum: defaultCurriculumId }}
              onClick={() => setMenuOpen(false)}
              activeProps={{ "aria-current": "page", className: "decoration-current" }}
            >
              {t("navigation.curriculum")}
            </Link>
          </AlignLinkButton.Root>
          <AlignLinkButton.Root asChild className="h-14 justify-start text-lg">
            <Link
              to="/exam"
              onClick={() => setMenuOpen(false)}
              activeProps={{ "aria-current": "page", className: "decoration-current" }}
            >
              {t("navigation.examArchive")}
            </Link>
          </AlignLinkButton.Root>
          <AlignLinkButton.Root asChild className="h-14 justify-start text-lg">
            <Link
              to="/alumni"
              onClick={() => setMenuOpen(false)}
              activeProps={{ "aria-current": "page", className: "decoration-current" }}
            >
              {t("navigation.alumni")}
            </Link>
          </AlignLinkButton.Root>
          <AlignLinkButton.Root asChild className="h-14 justify-start text-lg">
            <Link
              to="/resources"
              onClick={() => setMenuOpen(false)}
              activeProps={{ "aria-current": "page", className: "decoration-current" }}
            >
              {t("navigation.resources")}
            </Link>
          </AlignLinkButton.Root>
          <AlignLinkButton.Root asChild className="h-14 justify-start text-lg">
            <Link
              to="/roadmap"
              search={{ lulus: 8, semesterPaparan: 6 }}
              onClick={() => setMenuOpen(false)}
              activeProps={{ "aria-current": "page", className: "decoration-current" }}
            >
              {t("navigation.roadmap")}
            </Link>
          </AlignLinkButton.Root>
          <Faq className="h-14 justify-start text-lg" />
        </nav>
        <div className="mx-6 mt-auto flex justify-end gap-2 border-t border-stroke-soft-200 py-5">
          <GitHubButton />
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </AlignModal.Content>
    </AlignModal.Root>
  );
}
