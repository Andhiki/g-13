import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createDatabase } from "@g13/db/client";
import { authorize } from "@/server/auth-middleware";
import { rejectServerFunction, runServerOperation } from "@/server/server-function-error";
import { inspectDashboardHome } from "./service";

export const loadDashboardHome = createServerFn({ method: "GET" })
  .middleware([authorize("moderate")])
  .handler(async ({ context }) => {
    const { session } = context;
    const data = await runServerOperation(() =>
      inspectDashboardHome(createDatabase(env.DB), session.user),
    );
    if (data === null) rejectServerFunction(403, "FORBIDDEN");
    return {
      ...data,
      identity: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.image,
      },
    };
  });
