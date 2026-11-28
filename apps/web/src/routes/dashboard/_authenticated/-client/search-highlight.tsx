import { createContext, useContext, type ReactNode } from "react";
import { adminSearchSegments } from "../-shared/admin-search";

const AdminSearchNeedle = createContext("");

/** Provides the needle the visible rows were fetched with. */
export function AdminSearchHighlightScope({
  needle,
  children,
}: {
  needle: string;
  children: ReactNode;
}) {
  return <AdminSearchNeedle value={needle}>{children}</AdminSearchNeedle>;
}

/**
 * Builds a highlighter that only accepts the page's searched fields.
 * `children` must be that field's value (or a substring of it, e.g. a URL's host).
 */
export function createSearchHighlight<const F extends string>(fields: readonly F[]) {
  return function SearchHighlight({ field, children }: { field: F; children: string }) {
    const needle = useContext(AdminSearchNeedle);
    if (!fields.includes(field)) return children;
    const segments = adminSearchSegments(children, needle).map((segment, index) =>
      segment.match ? (
        <mark
          key={index}
          data-testid="search-match"
          className="rounded-[2px] bg-warning-light text-inherit"
        >
          {segment.text}
        </mark>
      ) : (
        segment.text
      ),
    );
    return <>{segments}</>;
  };
}
