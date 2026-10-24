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
      { rel: "preload", href: "/theme/sonic-dancing.gif", as: "image" },
      { rel: "stylesheet", href: flowStyles },
      { rel: "stylesheet", href: appStyles },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
  notFoundComponent: () => (
    <main>
      <h1>Halaman tidak ditemukan</h1>
      <Link to="/" search={{ kurikulum: "2026" }}>
        Kembali ke peta kurikulum
      </Link>
    </main>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="curriculum-theme">
          <div id="root">{children}</div>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
