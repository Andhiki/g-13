import { Link } from "@tanstack/react-router";
import { defaultCurriculumId } from "@g13/curriculum";
import { AlignButton } from "./button";
import { AlignLinkButton } from "./link-button";

function BrandLogo() {
  return (
    <a
      href="https://www.omahti.web.id/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="OmahTI, pembuat peta kurikulum"
      className="pointer-events-auto flex h-10 w-fit shrink-0 items-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-base"
    >
      <img
        src="/brand/omahti-light.svg"
        alt="OmahTI"
        width={54}
        height={21}
        className="h-[21px] w-auto dark:hidden"
      />
      <img
        src="/brand/omahti-dark.svg"
        alt="OmahTI"
        width={54}
        height={21}
        className="hidden h-[21px] w-auto dark:block"
      />
    </a>
  );
}

export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[var(--app-header-height)] items-center gap-4 border-b border-stroke-soft-200 bg-bg-white-0 px-4 text-text-strong-950 sm:gap-6 sm:px-6">
      <BrandLogo />
      <nav aria-label="Navigasi aplikasi" className="flex items-center gap-3 sm:gap-5">
        <AlignLinkButton.Root asChild>
          <Link
            to="/"
            search={{ kurikulum: defaultCurriculumId }}
            activeOptions={{ exact: true }}
            activeProps={{
              className: "text-text-strong-950 decoration-current",
              "aria-current": "page",
            }}
          >
            Peta
          </Link>
        </AlignLinkButton.Root>
        <AlignLinkButton.Root asChild>
          <Link
            to="/exam"
            activeProps={{
              className: "text-text-strong-950 decoration-current",
              "aria-current": "page",
            }}
          >
            Arsip Ujian
          </Link>
        </AlignLinkButton.Root>
      </nav>
      <AlignButton.Root asChild variant="primary" mode="filled" size="small" className="ml-auto">
        <Link to="/roadmap" search={{ lulus: 8, semesterPaparan: 6 }}>
          <span className="sm:hidden">Kuis</span>
          <span className="hidden sm:inline">Kuis roadmap</span>
        </Link>
      </AlignButton.Root>
    </header>
  );
}
