import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { getThesisSitemap } from "./_public/theses/-server/read.service";

const siteOrigin = "https://csugm.andhiki.tech";
const basePaths = [
  "/",
  "/roadmap",
  "/exam",
  "/faq",
  "/resources",
  "/alumni",
  "/alumni/all",
  "/lecturers",
  "/theses",
];

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sitemapXml(entries: { loc: string; lastmod?: string }[]): string {
  const urls = entries.map((entry) => {
    const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
    return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const baseEntries = basePaths.map((path) => ({
          loc: new URL(path, siteOrigin).toString(),
        }));
        try {
          const theses = await getThesisSitemap(createDatabase(env.DB));
          return new Response(
            sitemapXml([
              ...baseEntries,
              ...theses.map((entry) => ({
                loc: new URL(`/theses/${encodeURIComponent(entry.slug)}`, siteOrigin).toString(),
                lastmod: entry.updatedAt.toISOString().slice(0, 10),
              })),
            ]),
            {
              headers: {
                "content-type": "application/xml; charset=utf-8",
                "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
              },
            },
          );
        } catch {
          return new Response(sitemapXml(baseEntries), {
            headers: {
              "content-type": "application/xml; charset=utf-8",
              "cache-control": "public, max-age=300",
            },
          });
        }
      },
    },
  },
});
