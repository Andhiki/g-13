import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AlignButton } from "@/ui/button";
import { Typography } from "@/ui/typography";
import { useLocale } from "@/useLocale";

type PaginationQuery = Pick<
  UseInfiniteQueryResult,
  | "fetchNextPage"
  | "hasNextPage"
  | "isError"
  | "isFetching"
  | "isFetchingNextPage"
  | "isFetchNextPageError"
  | "isPending"
  | "refetch"
>;

export function ReviewFeedPagination({ query }: { query: PaginationQuery }) {
  const { text } = useLocale("lecturers");
  const { fetchNextPage, hasNextPage, isFetching, isError, isFetchNextPageError } = query;
  const nextPage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = nextPage.current;
    if (!sentinel || !hasNextPage || isFetching || isError) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage({ cancelRefetch: false });
      },
      { rootMargin: "0px 0px 200px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching, isError]);
  return (
    <>
      {query.isError && (
        <Typography as="p" variant="paragraph" color="danger" role="alert" className="mt-3">
          {text("Could not load reviews.")}
        </Typography>
      )}
      {(query.isPending || query.isFetchingNextPage) && (
        <Typography as="p" variant="paragraph" color="muted" role="status" className="mt-3">
          {text("Loading reviews…")}
        </Typography>
      )}
      {(hasNextPage || query.isError) && (
        <div ref={nextPage} className="mt-3">
          <AlignButton.Root
            size="small"
            variant="neutral"
            mode="stroke"
            disabled={isFetching}
            onClick={() => {
              if (query.isError && !isFetchNextPageError) void query.refetch();
              else void fetchNextPage({ cancelRefetch: false });
            }}
          >
            {text(query.isError ? "Retry loading reviews" : "Load more reviews")}
          </AlignButton.Root>
        </div>
      )}
    </>
  );
}
