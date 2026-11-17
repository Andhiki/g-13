import { createFileRoute } from "@tanstack/react-router";
import { CurriculumPage } from "./-curriculum/components/CurriculumPage";
import { validateCurriculumSearch } from "../search";

export const Route = createFileRoute("/")({
  validateSearch: validateCurriculumSearch,
  component: CurriculumPage,
});
