import { expect, it, mock } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

mock.module("../server/handler", () => ({
  loadLecturerDetail: mock(),
  loadLecturerDirectory: mock(),
  loadBrowserLikes: mock(),
  publishLecturerReview: mock(),
  updateReviewLike: mock(),
}));

const { updateReviewLikeMutationOptions } = await import("./mutations");
const { lecturerDetailQueryOptions, lecturerBrowserLikesQueryOptions } = await import("./queries");

const detailKey = lecturerDetailQueryOptions("lecturer").queryKey;
const likesKey = lecturerBrowserLikesQueryOptions("browser").queryKey;
const detail = {
  lecturer: {
    id: "lecturer",
    name: "Lecturer",
    reviewCount: 1,
    overallAverage: 5,
    clarityAverage: 5,
    supportAverage: 5,
    organizationAverage: 5,
    courses: [],
  },
  courses: [],
  reviews: [
    {
      id: "review",
      lecturerId: "lecturer",
      createdAt: new Date("2026-01-01"),
      courseId: "course",
      code: "CS",
      nameId: "Data",
      nameEn: "Data",
      authorName: "Anonymous",
      termLabel: "2026",
      body: "Helpful",
      clarity: 5,
      support: 5,
      organization: 5,
      overall: 5,
      likeCount: 3,
    },
  ],
};

for (const liked of [true, false]) {
  for (const fails of [true, false]) {
    it(`optimistically ${liked ? "likes" : "unlikes"} and ${fails ? "rolls back" : "settles successfully"}`, async () => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      client.setQueryData(detailKey, detail);
      const likes = liked ? ["other"] : ["other", "review"];
      client.setQueryData(likesKey, likes);
      let finish!: () => void;
      const response = new Promise<void>((resolve) => {
        finish = resolve;
      });
      let started!: () => void;
      const ready = new Promise<void>((resolve) => {
        started = resolve;
      });
      const mutation = client.getMutationCache().build(client, {
        ...updateReviewLikeMutationOptions(client),
        mutationFn: async () => {
          started();
          await response;
          if (fails) throw new Error("unavailable");
          return { ok: true as const };
        },
      });
      const result = mutation.execute({
        reviewId: "review",
        browserId: "browser",
        lecturerId: "lecturer",
        liked,
      });
      const settled = result.catch((error: unknown) => error);
      await ready;
      expect(mutation.state.status).toBe("pending");
      expect(client.getQueryData(detailKey)?.reviews[0]?.likeCount).toBe(liked ? 4 : 2);
      expect(client.getQueryData(likesKey)).toEqual(liked ? ["other", "review"] : ["other"]);
      finish();
      await settled;
      expect(mutation.state.status).toBe(fails ? "error" : "success");
      expect(client.getQueryData(detailKey)?.reviews[0]?.likeCount).toBe(fails ? 3 : liked ? 4 : 2);
      expect(client.getQueryData(likesKey)).toEqual(
        fails ? likes : liked ? ["other", "review"] : ["other"],
      );
      expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true);
      expect(client.getQueryState(likesKey)?.isInvalidated).toBe(true);
      client.clear();
    });
  }
}

it("reconciles both active caches before leaving pending state", async () => {
  const client = new QueryClient();
  client.setQueryData(detailKey, detail);
  client.setQueryData(likesKey, []);
  let finish!: () => void;
  const response = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let refetch!: () => void;
  const started = new Promise<void>((resolve) => {
    refetch = resolve;
  });
  const detailObserver = new QueryObserver(client, {
    queryKey: detailKey,
    staleTime: Infinity,
    queryFn: async () => {
      refetch();
      await response;
      return { ...detail, reviews: detail.reviews.map((review) => ({ ...review, likeCount: 9 })) };
    },
  });
  const likesObserver = new QueryObserver(client, {
    queryKey: likesKey,
    staleTime: Infinity,
    queryFn: async () => {
      await response;
      return ["review", "server-like"];
    },
  });
  const unsubscribeDetail = detailObserver.subscribe(() => {});
  const unsubscribeLikes = likesObserver.subscribe(() => {});
  try {
    const mutation = client.getMutationCache().build(client, {
      ...updateReviewLikeMutationOptions(client),
      mutationFn: async () => ({ ok: true as const }),
    });
    const result = mutation.execute({
      reviewId: "review",
      browserId: "browser",
      lecturerId: "lecturer",
      liked: true,
    });
    await started;
    expect(mutation.state.status).toBe("pending");
    expect(client.getQueryData(detailKey)?.reviews[0]?.likeCount).toBe(4);
    expect(client.getQueryData(likesKey)).toEqual(["review"]);
    finish();
    await result;
    expect(mutation.state.status).toBe("success");
    expect(client.getQueryData(detailKey)?.reviews[0]?.likeCount).toBe(9);
    expect(client.getQueryData(likesKey)).toEqual(["review", "server-like"]);
  } finally {
    unsubscribeDetail();
    unsubscribeLikes();
    client.clear();
  }
});

it("does not create absent cache entries", async () => {
  const client = new QueryClient();
  const mutation = client.getMutationCache().build(client, {
    ...updateReviewLikeMutationOptions(client),
    mutationFn: async () => {
      throw new Error("unavailable");
    },
  });
  await expect(
    mutation.execute({
      reviewId: "review",
      browserId: "browser",
      lecturerId: "lecturer",
      liked: true,
    }),
  ).rejects.toThrow("unavailable");
  expect(client.getQueryData(detailKey)).toBeUndefined();
  expect(client.getQueryData(likesKey)).toBeUndefined();
  client.clear();
});
