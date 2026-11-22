import { StatusPage } from "./-StatusPage";
import { Toaster } from "../ui/toast";
import { PublicFrame } from "./_public/-PublicFrame";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import { LazyMotion, domMax } from "motion/react";
import { AppPreferences, darkModeScript } from "../ui/theme-preference";
import { I18nextProvider } from "react-i18next";
import flowStyles from "@xyflow/react/dist/style.css?url";
import interFont from "../fonts/inter-subset.woff2?url";
import geistFont from "../fonts/geist-subset.woff2?url";
import appStyles from "../styles.css?url";
import { createI18n, messageNamespace } from "../i18n";
import { readLanguage } from "../language";
import { loadMessages } from "@g13/i18n/messages";
import type { Language } from "@g13/i18n";
import type { QueryClient } from "@tanstack/react-query";

export const Route = createRootRouteWithContext<{
  language?: Language;
  queryClient: QueryClient;
}>()({
  beforeLoad: async ({ context }) => {
    const language = context.language ?? readLanguage();
    return { language, common: await loadMessages(language, "common") };
  },
  loader: async ({ context, location }) => {
    const namespace = messageNamespace(location.pathname);
    return {
      language: context.language,
      pathname: location.pathname,
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
      ...(import.meta.env.MODE === "staging" || import.meta.env.MODE === "staging-e2e"
        ? [{ name: "robots", content: "noindex, nofollow" }]
        : []),
      {
        name: "description",
        content:
          loaderData?.common[
            "Jelajahi peta kurikulum 2021 dan 2026, prasyarat mata kuliah, roadmap personal, dan arsip ujian S1 Ilmu Komputer UGM."
          ],
      },
      { title: loaderData?.common["Everything CS UGM"] },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: loaderData?.common["Everything CS UGM"] },
      { property: "og:image", content: "https://csugm.andhiki.tech/social-preview.png" },
      { property: "og:title", content: loaderData?.common["Everything CS UGM"] },
      {
        property: "og:description",
        content:
          loaderData?.common[
            "Jelajahi peta kurikulum 2021 dan 2026, prasyarat mata kuliah, roadmap personal, dan arsip ujian S1 Ilmu Komputer UGM."
          ],
      },
    ],
    links: [
      { rel: "canonical", href: `https://csugm.andhiki.tech${loaderData?.pathname ?? "/"}` },
      { rel: "preload", as: "font", type: "font/woff2", crossOrigin: "anonymous", href: interFont },
      { rel: "preload", as: "font", type: "font/woff2", crossOrigin: "anonymous", href: geistFont },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: flowStyles },
      { rel: "stylesheet", href: appStyles },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
});

function NotFound() {
  return (
    <PublicFrame>
      <StatusPage kind="notFound" />
    </PublicFrame>
  );
}

function ErrorPage({ reset }: { reset: () => void }) {
  return <StatusPage kind="error" reset={reset} />;
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
      className="m-0 h-full w-full min-w-80 bg-bg-white-0 font-sans text-text-strong-950 [&_.remixicon_path]:origin-center [&_.remixicon_path]:scale-[0.8996] [font-synthesis:none] [text-rendering:optimizeLegibility] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-1 [&_a:focus-visible]:outline-primary-base/50"
    >
      <head>
        <HeadContent />
        {import.meta.env.PROD && (
          <script
            type="module"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "38f322cab5754b91a26627775d91250a"}'
          />
        )}
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("g13-blur")==="off")document.documentElement.setAttribute("data-no-blur","")}catch{}',
          }}
        />
      </head>
      <body className="m-0 h-full w-full min-w-80 bg-bg-white-0">
        <I18nextProvider i18n={i18n}>
          <AppPreferences>
            <LazyMotion features={domMax}>
              <div id="root" className="m-0 h-full w-full min-w-80">
                {children}
                <Toaster />
              </div>
            </LazyMotion>
          </AppPreferences>
        </I18nextProvider>
        <Scripts />
      </body>
    </html>
  );
}
