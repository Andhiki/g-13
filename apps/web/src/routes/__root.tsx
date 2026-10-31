import { defaultCurriculumId } from "@g13/curriculum";
import { Toaster } from "../ui/toast";
import { CursorProvider } from "../ui/cursor-preference";
import { AppHeader } from "../ui/app-header";
import { StatusIllustration } from "../ui/status-illustration";
import { Typography } from "../ui/typography";
import { AlignButton } from "../ui/button";
import { RiArrowLeftLine, RiRefreshLine } from "@remixicon/react";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import { LazyMotion, domAnimation } from "motion/react";
import { ThemeProvider } from "next-themes";
import { ThemePreferenceProvider, themePreferenceScript } from "../ui/theme-preference";
import { I18nextProvider, useTranslation } from "react-i18next";
import flowStyles from "@xyflow/react/dist/style.css?url";
import interFont from "../fonts/inter-subset.woff2?url";
import geistFont from "../fonts/geist-subset.woff2?url";
import appStyles from "../styles.css?url";
import { createI18n, messageNamespace } from "../i18n";
import { readLanguage } from "../language";
import { loadMessages } from "@g13/i18n/messages";
import type { Language } from "@g13/i18n";

export const Route = createRootRouteWithContext<{ language?: Language }>()({
  beforeLoad: async ({ context }) => {
    const language = context.language ?? readLanguage();
    return { language, common: await loadMessages(language, "common") };
  },
  loader: async ({ context, location }) => {
    const namespace = messageNamespace(location.pathname);
    return {
      language: context.language,
      namespace,
      common: context.common,
      messages: await loadMessages(context.language, namespace),
    };
  },
  shouldReload: true,
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { name: "theme-color", content: "#ffffff" },
      {
        name: "description",
        content:
          loaderData?.common[
            "Jelajahi peta kurikulum 2021 dan 2026, prasyarat mata kuliah, roadmap personal, dan arsip ujian S1 Ilmu Komputer UGM."
          ],
      },
      { title: loaderData?.common["Everything CS UGM"] },
    ],
    links: [
      { rel: "preload", as: "font", type: "font/woff2", crossOrigin: "anonymous", href: interFont },
      { rel: "preload", as: "font", type: "font/woff2", crossOrigin: "anonymous", href: geistFont },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: flowStyles },
      { rel: "stylesheet", href: appStyles },
    ],
  }),
  shellComponent: RootDocument,
  component: AppLayout,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});

function StatusPage({ kind, reset }: { kind: "notFound" | "error"; reset?: () => void }) {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-6 py-16 text-center">
      <div className="flex w-full max-w-lg flex-col items-center">
        <StatusIllustration kind={kind} />
        <Typography as="h1" variant="title">
          {t(`${kind}.title`)}
        </Typography>
        <Typography className="mt-3 text-text-sub-600">{t(`${kind}.description`)}</Typography>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {kind === "error" && (
            <AlignButton.Root onClick={reset}>
              <RiRefreshLine className="size-5" />
              {t("error.retry")}
            </AlignButton.Root>
          )}
          <AlignButton.Root
            asChild
            variant={kind === "error" ? "neutral" : "primary"}
            mode={kind === "error" ? "stroke" : "filled"}
          >
            <Link to="/" search={{ kurikulum: defaultCurriculumId }}>
              <RiArrowLeftLine className="size-5" />
              {t("notFound.home")}
            </Link>
          </AlignButton.Root>
        </div>
      </div>
    </main>
  );
}

function NotFound() {
  return <StatusPage kind="notFound" />;
}

function ErrorPage({ reset }: { reset: () => void }) {
  return <StatusPage kind="error" reset={reset} />;
}

function AppLayout() {
  return (
    <div className="min-h-dvh pt-[var(--app-header-height)]">
      <AppHeader />
      <Outlet />
      <Toaster />
    </div>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const { language, namespace, messages, common } = Route.useLoaderData() ?? {
    language: "id" as const,
    namespace: "common" as const,
    messages: {},
    common: {},
  };
  const i18n = useMemo(
    () => createI18n({ language, namespace, messages, common }),
    [language, namespace, messages, common],
  );
  return (
    <html
      lang={language}
      suppressHydrationWarning
      className="m-0 h-full w-full min-w-80 bg-bg-white-0 font-sans text-text-strong-950 [&_.remixicon_path]:origin-center [&_.remixicon_path]:scale-[0.8996] [font-synthesis:none] [text-rendering:optimizeLegibility] [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-offset-3 [&_a:focus-visible]:outline-primary-base"
    >
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themePreferenceScript }} />
      </head>
      <body className="m-0 h-full w-full min-w-80 bg-bg-white-0">
        <I18nextProvider i18n={i18n}>
          <ThemeProvider attribute="class" defaultTheme="system" storageKey="curriculum-theme">
            <ThemePreferenceProvider>
              <CursorProvider>
                <LazyMotion features={domAnimation}>
                  <div id="root" className="m-0 h-full w-full min-w-80">
                    {children}
                  </div>
                </LazyMotion>
              </CursorProvider>
            </ThemePreferenceProvider>
          </ThemeProvider>
        </I18nextProvider>
        <Scripts />
      </body>
    </html>
  );
}
