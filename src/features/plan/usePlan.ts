import { useMemo } from "react";
import type { FarmAssessment, Vision } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useMachinery } from "../shared/useMerged";
import { cropCatalogue } from "../../data/catalog/crops";
import { methodCatalogue } from "../../data/catalog/methods";
import { marketData } from "../../data/catalog/marketData";
import {
  DEMO_ASSESSMENT,
  DEMO_VISION,
  allocateBudget,
  availableBudget,
  buildCalendar,
  buyVsRent,
  recommendCrops,
  recommendMethods,
  rankSupport,
  relevantSupport,
  supportContext,
  resourceNeeds,
  typicalCost,
} from "../../services/planning/planner";

/** Demo planting date for Spandana's tomato (matches Farm #27). */
const DEMO_PLANT_DATE = "2026-06-28";

/**
 * The farmer's plan with everything the journey screens derive from it.
 * Unsaved steps fall back to the demo scenario so the judge flow is smooth,
 * but nothing counts as done until the farmer saves it.
 */
export function usePlan() {
  const { plan, session, updatePlan, resetPlan } = useAppStore();
  const machinery = useMachinery();

  return useMemo(() => {
    const assessment: FarmAssessment = plan.assessment ?? { ...DEMO_ASSESSMENT, name: session?.name ?? DEMO_ASSESSMENT.name };
    const vision: Vision = plan.vision ?? DEMO_VISION;
    const budget = plan.budget ? plan.budget.reduce((s, l) => s + l.amount, 0) : availableBudget(assessment, vision);
    const crops = recommendCrops(assessment, vision);
    const crop = cropCatalogue.find((c) => c.id === plan.cropId);
    const methods = crop ? recommendMethods(crop, assessment, budget) : [];
    const method = methodCatalogue.find((m) => m.id === plan.methodId);
    const typical = crop ? typicalCost(crop, assessment.landAcres, method) : undefined;
    const budgetLines = plan.budget ?? allocateBudget(budget, method);
    const budgetGap = typical ? Math.max(0, typical[0] - budget) : 0;
    const rent = buyVsRent(method, assessment.landAcres, machinery);
    const market = crop ? marketData.find((m) => m.crop === crop.name) : undefined;
    const plantDate = plan.plantDate ?? DEMO_PLANT_DATE;
    const calendar = crop ? buildCalendar(crop, method, plantDate) : [];
    const needs = crop ? resourceNeeds(crop, method, assessment, budgetGap) : undefined;
    const support = relevantSupport(assessment, crop, method, budgetGap);
    const allSupport = rankSupport(supportContext(assessment, crop, method, budgetGap));

    const done = {
      assessment: !!plan.assessment,
      vision: !!plan.vision,
      crop: !!plan.cropId,
      method: !!plan.methodId,
      investment: !!plan.budget,
      market: !!plan.reviewed?.includes("market"),
      schedule: !!plan.confirmedAt,
      resources: !!plan.reviewed?.includes("resources"),
    };

    return {
      plan,
      assessment,
      vision,
      budget,
      crops,
      crop,
      methods,
      method,
      typical,
      budgetLines,
      budgetGap,
      rent,
      market,
      plantDate,
      calendar,
      needs,
      support,
      allSupport,
      done,
      updatePlan,
      resetPlan,
      markReviewed: (step: string) => updatePlan({ reviewed: [...new Set([...(plan.reviewed ?? []), step])] }),
    };
  }, [plan, session, machinery, updatePlan, resetPlan]);
}

export type PlanState = ReturnType<typeof usePlan>;
