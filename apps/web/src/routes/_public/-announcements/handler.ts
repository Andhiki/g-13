import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { getActiveAnnouncements } from "./service";

export const loadActiveAnnouncements = createServerFn({ method: "GET" }).handler(() =>
  getActiveAnnouncements(createDatabase(env.DB)),
);
