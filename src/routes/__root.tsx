import { createRootRoute, HeadContent, Outlet, Scripts, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import flowStyles from "@xyflow/react/dist/style.css?url";
import appStyles from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#f5f3ed" },
      {
        name: "description",
        content: "Peta kurikulum dan prasyarat Program Studi Ilmu Komputer UGM.",
      },
      { title: "Peta Kurikulum Ilmu Komputer UGM" },
    ],
    links: [
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
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        <div id="root">{children}</div>
        <Scripts />
      </body>
    </html>
  );
}
