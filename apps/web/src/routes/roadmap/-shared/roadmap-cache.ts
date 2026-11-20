import { buildRoadmap, type Roadmap } from "./planner";
import type { PlanningInput } from "./planning-input";

const plans = new Map<string, Roadmap>();
const maxPlans = 32;

export function getRoadmap(input: PlanningInput) {
  const key = JSON.stringify(input);
  let plan = plans.get(key);
  if (!plan) {
    plan = buildRoadmap(input);
    if (plans.size >= maxPlans) plans.delete(plans.keys().next().value!);
    plans.set(key, plan);
  }
  return plan;
}
