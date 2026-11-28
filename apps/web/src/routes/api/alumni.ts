import { createFileRoute } from "@tanstack/react-router";
import { serverAdapters } from "@/server/adapters";
import { alumniDirectoryResponse, loadAlumniDirectory } from "../_public/alumni/-server/directory";

export const Route = createFileRoute("/api/alumni")({
  server: {
    handlers: {
      GET: async () => alumniDirectoryResponse(await loadAlumniDirectory(serverAdapters.alumni)),
    },
  },
});
