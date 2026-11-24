import { queryOptions } from "@tanstack/react-query";
import { loadLearningResources } from "../-server/handler";

const publicDataStaleTime = 5 * 60 * 1000;

export function learningResourcesQueryOptions() {
  return queryOptions({
    queryKey: ["resources", "list"],
    queryFn: () => loadLearningResources(),
    staleTime: publicDataStaleTime,
    refetchOnWindowFocus: false,
  });
}
