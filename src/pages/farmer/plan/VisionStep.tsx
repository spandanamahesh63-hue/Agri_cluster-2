import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Compass, IndianRupee, Target } from "lucide-react";
import type { VisionMode } from "../../../types";
import { StepLayout } from "../../../features/plan/StepLayout";
import { usePlan } from "../../../features/plan/usePlan";
import { stepHref } from "../../../features/plan/steps";
import { Button } from "../../../components/ui/Button";
import { InfoNote } from "../../../components/ui/Badge";
import { TextInput } from "../../../components/forms/fields";
import { formatINR } from "../../../utils/format";

const options: { id: VisionMode; title: string; prompt?: string; description: string; icon: typeof Target }[] = [
  {
    id: "investment",
    title: "I have money to invest",
    prompt: "I have ₹ available",
    description: "See which crops, methods and resources fit your budget, and what to rent instead of buy.",
    icon: IndianRupee,
  },
  {
    id: "income",
    title: "I have an income goal",
    prompt: "I want to earn ₹",
    description: "Work backwards from a target to the crops, land, method and investment it could take. Always indicative.",
    icon: Target,
  },
  {
    id: "guided",
    title: "I have no idea yet",
    description: "We'll guide you using your land, soil, water, energy, experience and local market.",
    icon: Compass,
  },
];

/** Step 2 — the farmer's starting intention (spec §5). */
export function VisionStep() {
  const p = usePlan();
  const navigate = useNavigate();
  const [mode, setMode] = useState<VisionMode>(p.vision.mode);
  const [amount, setAmount] = useState(String(p.vision.amount ?? (mode === "income" ? 100000 : p.assessment.investment)));
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (mode !== "guided" && !(value > 0)) return setError(mode === "income" ? "Please enter your income goal." : "Please enter the amount you have.");
    p.updatePlan({ vision: mode === "guided" ? { mode } : { mode, amount: value } });
    navigate(stepHref("crop"));
  };

  return (
    <StepLayout
      step="vision"
      description="Pick how you'd like to start. You can change this later."
      action={
        <Button type="submit" form="vision">
          See crop options
        </Button>
      }
    >
      <form id="vision" onSubmit={submit} noValidate className="space-y-4">
        <fieldset>
          <legend className="sr-only">Starting intention</legend>
          <div className="grid gap-3 md:grid-cols-3">
            {options.map((o) => {
              const selected = o.id === mode;
              return (
                <label
                  key={o.id}
                  className={clsx(
                    "flex cursor-pointer flex-col rounded-xl border bg-surface p-4 shadow-card transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200",
                    selected ? "border-brand-500 ring-1 ring-brand-500" : "border-line hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="mode"
                    className="sr-only"
                    checked={selected}
                    onChange={() => {
                      setMode(o.id);
                      setError(null);
                      if (o.id === "income") setAmount("100000");
                      if (o.id === "investment") setAmount(String(p.assessment.investment));
                    }}
                  />
                  <span className={clsx("mb-3 grid size-9 place-items-center rounded-lg", selected ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700")}>
                    <o.icon aria-hidden className="size-4.5" />
                  </span>
                  <span className="text-sm font-semibold">{o.title}</span>
                  <span className="mt-1 text-[13px] leading-snug text-ink-muted">{o.description}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {mode !== "guided" && (
          <div className="rounded-xl border border-line bg-surface p-4">
            <label htmlFor="vision-amount" className="block text-[13px] font-medium">
              {options.find((o) => o.id === mode)!.prompt}
            </label>
            <div className="mt-1.5 flex max-w-sm items-center gap-3">
              <TextInput
                id="vision-amount"
                type="number"
                inputMode="numeric"
                min="0"
                step="5000"
                value={amount}
                aria-invalid={!!error}
                aria-describedby="vision-hint"
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
              />
              <span className="shrink-0 text-sm font-medium tabular-nums">{Number(amount) > 0 ? formatINR(Number(amount)) : ""}</span>
            </div>
            <p id="vision-hint" className={clsx("mt-1.5 text-[12px]", error ? "text-danger" : "text-ink-subtle")}>
              {error ?? (mode === "income" ? "Net income after costs, for one season on your land." : "For this season, including seeds, labour and rentals.")}
            </p>
          </div>
        )}

        {mode === "income" && (
          <InfoNote>
            Income figures are indicative estimates based on sample assumptions, and depend on weather, yields and market prices. They are never
            guaranteed.
          </InfoNote>
        )}
      </form>
    </StepLayout>
  );
}
