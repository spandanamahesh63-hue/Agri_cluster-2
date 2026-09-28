import type { PlanState } from "./usePlan";

export type StepId = keyof PlanState["done"];

export interface PlanStep {
  id: StepId;
  label: string;
  question: string;
  /** Steps that must be saved before this one makes sense. */
  requires: StepId[];
}

/** The farmer decision journey, in order (AGRI CLUSTER master prompt §4.1). */
export const planSteps: PlanStep[] = [
  { id: "assessment", label: "Farm", question: "Tell us about you and your farm", requires: [] },
  { id: "vision", label: "Goal", question: "Where do you want to start?", requires: ["assessment"] },
  { id: "crop", label: "Crop", question: "Which crops suit your farm?", requires: ["assessment", "vision"] },
  { id: "method", label: "Method", question: "How should you grow it?", requires: ["crop"] },
  { id: "investment", label: "Investment", question: "How could your money be used?", requires: ["method"] },
  { id: "market", label: "Market", question: "Who buys it, and when?", requires: ["crop"] },
  { id: "schedule", label: "Plan", question: "Your cropping plan and calendar", requires: ["method", "investment"] },
  { id: "resources", label: "Resources", question: "Who and what can help you?", requires: ["method"] },
];

export const stepHref = (id: StepId) => `/farmer/plan/${id}`;

export function nextStep(id: StepId): PlanStep | undefined {
  return planSteps[planSteps.findIndex((s) => s.id === id) + 1];
}

export function prevStep(id: StepId): PlanStep | undefined {
  return planSteps[planSteps.findIndex((s) => s.id === id) - 1];
}

/** First step the farmer hasn't completed yet. */
export function currentStep(done: PlanState["done"]): PlanStep {
  return planSteps.find((s) => !done[s.id]) ?? planSteps[planSteps.length - 1];
}
