import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { planSteps, prevStep, stepHref, type StepId } from "./steps";
import { PlanStepper } from "./PlanStepper";
import { usePlan } from "./usePlan";
import { Card } from "../../components/ui/Card";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";

interface StepLayoutProps {
  step: StepId;
  description?: ReactNode;
  children: ReactNode;
  /** The step's main action, rendered in the footer (e.g. a submit button). */
  action?: ReactNode;
  aside?: ReactNode;
}

/** Frame for every journey step: back link, stepper, title, content, footer. */
export function StepLayout({ step, description, children, action, aside }: StepLayoutProps) {
  const { done } = usePlan();
  const meta = planSteps.find((s) => s.id === step)!;
  const missing = meta.requires.filter((r) => !done[r]);
  const prev = prevStep(step);

  return (
    <>
      <Link to="/farmer/plan" className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-3.5" />
        Plan overview
      </Link>
      <PlanStepper current={step} done={done} />
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{meta.question}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </header>

      {missing.length > 0 ? (
        <Card>
          <EmptyState
            title={`Complete “${planSteps.find((s) => s.id === missing[0])!.label}” first`}
            description="This step uses your answers from earlier steps."
            action={
              <ButtonLink to={stepHref(missing[0])} size="sm">
                Go to {planSteps.find((s) => s.id === missing[0])!.label}
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className={aside ? "grid gap-6 lg:grid-cols-3" : undefined}>
          <div className={aside ? "space-y-6 lg:col-span-2" : "space-y-6"}>
            {children}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              {prev ? (
                <Link to={stepHref(prev.id)} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-muted hover:text-ink">
                  <ChevronLeft aria-hidden className="size-4" />
                  Back to {prev.label}
                </Link>
              ) : (
                <span />
              )}
              {action}
            </div>
          </div>
          {aside && <aside className="space-y-4">{aside}</aside>}
        </div>
      )}
    </>
  );
}
