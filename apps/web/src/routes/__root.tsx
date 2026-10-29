import { defaultCurriculumId } from "@g13/curriculum";
import { Toaster } from "../ui/toast";
import { AppHeader } from "../ui/app-header";
import { Typography } from "../ui/typography";
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
import { I18nextProvider, useTranslation } from "react-i18next";
import flowStyles from "@xyflow/react/dist/style.css?url";
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#171717", media: "(prefers-color-scheme: dark)" },
      {
        name: "description",
        content:
          loaderData?.common[
            "Jelajahi peta kurikulum 2021 dan 2026, prasyarat mata kuliah, roadmap kuliah, dan arsip ujian S1 Ilmu Komputer UGM."
          ],
      },
      { title: loaderData?.common["Everything CS UGM"] },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: flowStyles },
      { rel: "stylesheet", href: appStyles },
    ],
  }),
  shellComponent: RootDocument,
  component: AppLayout,
  notFoundComponent: NotFound,
});

function NotFound() {
  const { t } = useTranslation();
  return (
    <main>
      <Typography as="h1" variant="title">
        {t("notFound.title")}
      </Typography>
      <Link to="/" search={{ kurikulum: defaultCurriculumId }}>
        {t("notFound.home")}
      </Link>
    </main>
  );
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
  const { language, namespace, messages, common } = Route.useLoaderData();
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
      </head>
      <body className="m-0 h-full w-full min-w-80 bg-bg-white-0">
        <I18nextProvider i18n={i18n}>
          <ThemeProvider attribute="class" defaultTheme="system" storageKey="curriculum-theme">
            <LazyMotion features={domAnimation}>
              <div id="root" className="m-0 h-full w-full min-w-80">
                {children}
              </div>
            </LazyMotion>
          </ThemeProvider>
        </I18nextProvider>
        <Scripts />
      </body>
    </html>
  );
}
