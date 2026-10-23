import { createFileRoute } from "@tanstack/react-router";
import App from "../App";
import { validateCurriculumSearch } from "../search";

export const Route = createFileRoute("/")({
  validateSearch: validateCurriculumSearch,
  component: App,
});
