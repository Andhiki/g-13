import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { runServerOperation } from "@/server/server-function-error";
import { listPublicResources } from "./repository";

export const loadLearningResources = createServerFn({ method: "GET" }).handler(async () =>
  runServerOperation(() => listPublicResources(createDatabase(env.DB))),
);
