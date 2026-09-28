import { Link } from "react-router-dom";
import clsx from "clsx";
import { Check } from "lucide-react";
import { planSteps, stepHref, type StepId } from "./steps";
import type { PlanState } from "./usePlan";

/** Where am I, what's done, what's next (spec §25). */
export function PlanStepper({ current, done }: { current: StepId; done: PlanState["done"] }) {
  const index = planSteps.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Planning steps" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <p className="mb-2 text-[12px] text-ink-subtle">
        Step {index + 1} of {planSteps.length}
      </p>
      <ol className="flex min-w-max gap-1">
        {planSteps.map((s, i) => {
          const isCurrent = s.id === current;
          const isDone = done[s.id];
          const reachable = s.requires.every((r) => done[r]);
          const body = (
            <>
              <span
                aria-hidden
                className={clsx(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  isDone ? "bg-brand-600 text-white" : isCurrent ? "bg-brand-100 text-brand-800 ring-2 ring-brand-600" : "bg-sunken text-ink-subtle",
                )}
              >
                {isDone ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={clsx("text-[13px]", isCurrent ? "font-semibold text-ink" : isDone ? "text-ink" : "text-ink-subtle")}>{s.label}</span>
              <span className="sr-only">{isDone ? " (done)" : isCurrent ? " (current step)" : ""}</span>
            </>
          );
          const cls = clsx(
            "flex items-center gap-2 rounded-lg border px-2.5 py-1.5",
            isCurrent ? "border-brand-200 bg-brand-50" : "border-transparent",
          );
          return (
            <li key={s.id} aria-current={isCurrent ? "step" : undefined}>
              {reachable && !isCurrent ? (
                <Link to={stepHref(s.id)} className={clsx(cls, "hover:bg-sunken")}>
                  {body}
                </Link>
              ) : (
                <span className={cls}>{body}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
