import { afterAll } from "bun:test";
import { disposeSharedTestPlatform, enableSharedTestPlatform } from "./database";

enableSharedTestPlatform();

afterAll(async () => {
  await disposeSharedTestPlatform();
});
