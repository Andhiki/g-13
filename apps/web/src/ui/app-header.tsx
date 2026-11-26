import { useEffect, useState, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { RiRouteLine } from "@remixicon/react";
import { AlignDrawer } from "./drawer";
import { Link } from "@tanstack/react-router";
import { defaultCurriculumId } from "@g13/curriculum/ids";
import { Image } from "@unpic/react";
import { themeMode, useThemeMode } from "./theme-preference";
import { useKeyboardShortcuts } from "./shortcuts";
import { Settings } from "./settings";
import { AlignButton } from "./button";
import { AlignLinkButton } from "./link-button";
import { useTranslation } from "react-i18next";

function MenuIcon({ open }: { open: boolean }) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.2, bounce: 0 };
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
      className="pointer-events-auto flex h-10 w-fit shrink-0 items-center gap-1 rounded md:gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-base"
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

const DESKTOP_NAV_ITEMS = [
  { to: "/exam", labelKey: "navigation.examArchive" },
  { to: "/alumni", labelKey: "navigation.alumni" },
  { to: "/lecturers", labelKey: "navigation.lecturers" },
  { to: "/resources", labelKey: "navigation.resources" },
  { to: "/faq", labelKey: "navigation.faq" },
] as const;

const MOBILE_NAV_ITEMS = [
  { to: "/", labelKey: "navigation.curriculum", search: { kurikulum: defaultCurriculumId } },
  { to: "/exam", labelKey: "navigation.examArchive" },
  { to: "/alumni", labelKey: "navigation.alumni" },
  { to: "/lecturers", labelKey: "navigation.lecturers" },
  { to: "/resources", labelKey: "navigation.resources" },
  { to: "/roadmap", labelKey: "navigation.roadmap", search: { lulus: 8, semesterPaparan: 6 } },
  { to: "/faq", labelKey: "navigation.faq" },
] as const;

const ACTIVE_NAV_PROPS = {
  className: "decoration-current",
  "aria-current": "page" as const,
};

function DesktopNav() {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("navigation.label")} className="hidden items-center gap-5 md:flex">
      {DESKTOP_NAV_ITEMS.map((item) => (
        <AlignLinkButton.Root key={item.to} asChild>
          <Link to={item.to} activeProps={ACTIVE_NAV_PROPS}>
            {t(item.labelKey)}
          </Link>
        </AlignLinkButton.Root>
      ))}
    </nav>
  );
}

function DesktopActions() {
  const { t } = useTranslation();
  return (
    <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
      <Settings />
      <AlignButton.Root
        asChild
        variant="neutral-inverse"
        mode="filled"
        size="small"
        className="px-2 md:px-3"
      >
        <Link to="/roadmap" search={{ lulus: 8, semesterPaparan: 6 }}>
          <RiRouteLine aria-hidden="true" className="size-4" />
          {t("navigation.roadmap")}
        </Link>
      </AlignButton.Root>
    </div>
  );
}

function MobileNavDrawer({ menuOpen, onClose }: { menuOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <AlignDrawer.Content
      aria-describedby={undefined}
      className="w-[min(85vw,340px)] max-w-none pt-0 text-text-strong-950 md:hidden"
    >
      <AlignDrawer.Title className="sr-only">{t("navigation.label")}</AlignDrawer.Title>
      <div className="flex h-[var(--app-header-height)] shrink-0 items-center justify-between border-b border-stroke-soft-200 px-4 pt-[env(safe-area-inset-top)]">
        <BrandLogo onClick={onClose} />
        <AlignDrawer.Close asChild>
          <AlignButton.Root
            data-drawer-no-drag=""
            variant="neutral"
            mode="ghost"
            className="size-11 p-2.5"
            aria-label={t("navigation.close")}
          >
            <MenuIcon open={menuOpen} />
          </AlignButton.Root>
        </AlignDrawer.Close>
      </div>
      <nav
        aria-label={t("navigation.mobileLabel")}
        className="flex flex-col divide-y divide-stroke-soft-200 px-6"
      >
        {MOBILE_NAV_ITEMS.map((item) => (
          <AlignLinkButton.Root key={item.to} asChild className="h-14 justify-start text-lg">
            <Link
              to={item.to}
              search={"search" in item ? item.search : undefined}
              onClick={onClose}
              activeProps={ACTIVE_NAV_PROPS}
            >
              {t(item.labelKey)}
            </Link>
          </AlignLinkButton.Root>
        ))}
      </nav>
      <div className="mx-6 mt-auto flex justify-end gap-2 border-t border-stroke-soft-200 py-5">
        <Settings />
      </div>
    </AlignDrawer.Content>
  );
}

export function AppHeader({ announcement }: { announcement?: ReactNode } = {}) {
  const { resolved } = useThemeMode();
  useKeyboardShortcuts({
    d: {
      run: () => themeMode.set(resolved === "dark" ? "light" : "dark"),
      description: "Ganti tema",
    },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <AlignDrawer.Root open={menuOpen} onOpenChange={setMenuOpen} side="right">
      <div className="fixed inset-x-0 top-0 z-60 pt-[env(safe-area-inset-top)] text-text-strong-950">
        {announcement}
        <header className="flex h-16 items-center gap-1 border-b border-stroke-soft-200 bg-bg-white-0 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:gap-6 md:pl-[max(1.5rem,env(safe-area-inset-left))] md:pr-[max(1.5rem,env(safe-area-inset-right))]">
          <BrandLogo />
          <DesktopNav />
          <DesktopActions />
          <AlignDrawer.Trigger asChild>
            <AlignButton.Root
              variant="neutral"
              mode="ghost"
              className="ml-auto size-11 p-2.5 md:hidden"
              aria-label={menuOpen ? t("navigation.close") : t("navigation.open")}
              aria-expanded={menuOpen}
            >
              <MenuIcon open={menuOpen} />
            </AlignButton.Root>
          </AlignDrawer.Trigger>
        </header>
      </div>
      <MobileNavDrawer menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </AlignDrawer.Root>
  );
}
