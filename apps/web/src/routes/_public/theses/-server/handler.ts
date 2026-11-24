import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { runServerOperation } from "@/server/server-function-error";
import { thesisSlugInputSchema } from "../-shared/schema";
import type { ThesesIndexState } from "../-shared/thesis";
import { getThesesIndex, getThesisDetail } from "./read.service";

export const loadThesesIndex = createServerFn({ method: "GET" }).handler(
  async (): Promise<ThesesIndexState> => {
    try {
      return { status: "ready", data: await getThesesIndex(createDatabase(env.DB)) };
    } catch (error) {
      console.error("Thesis index failed", error);
      setResponseStatus(503, "Service Unavailable");
      return { status: "unavailable" };
    }
  },
);

export const loadThesisDetail = createServerFn({ method: "GET" })
  .validator(thesisSlugInputSchema)
  .handler(async ({ data }) =>
    runServerOperation(() => getThesisDetail(createDatabase(env.DB), data.slug)),
  );
