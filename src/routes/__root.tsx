import { Typography } from "../ui/typography";
import { createRootRoute, HeadContent, Outlet, Scripts, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import flowStyles from "@xyflow/react/dist/style.css?url";
import appStyles from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#171717", media: "(prefers-color-scheme: dark)" },
      {
        name: "description",
        content: "Peta kurikulum dan prasyarat Program Studi Ilmu Komputer UGM.",
      },
      { title: "Peta Kurikulum Ilmu Komputer UGM" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preload", href: "/theme/sonic-dancing.gif", as: "image" },
      { rel: "stylesheet", href: flowStyles },
      { rel: "stylesheet", href: appStyles },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
  notFoundComponent: () => (
    <main>
      <Typography as="h1" variant="title">
        Halaman tidak ditemukan
      </Typography>
      <Link to="/" search={{ kurikulum: "2026" }}>
        Kembali ke peta kurikulum
      </Link>
    </main>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className="m-0 h-full w-full min-w-80 bg-bg-white-0 font-sans text-text-strong-950 [&_.remixicon_path]:origin-center [&_.remixicon_path]:scale-[0.8996] [font-synthesis:none] [text-rendering:optimizeLegibility] [&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-offset-3 [&_a:focus-visible]:outline-primary-base"
    >
      <head>
        <HeadContent />
      </head>
      <body className="m-0 h-full w-full min-w-80 bg-bg-white-0">
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="curriculum-theme">
          <div id="root" className="m-0 h-full w-full min-w-80">
            {children}
          </div>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
