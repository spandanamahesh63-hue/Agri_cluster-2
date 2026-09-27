import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import type { CropStage, FarmerObjective, FarmerProfile, FarmingMethod, IrrigationType } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { MethodExplainer } from "../../features/farmer/MethodExplainer";
import { methods, objectives } from "../../data/mock/planning";
import { stageLabel } from "../../services/intelligence/engine";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ChoiceCards, FormField, SelectInput, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";

const steps = ["Your goal", "Your farm", "Your crop", "How you farm"];
type Declared = NonNullable<FarmerProfile["declared"]>;

/** Progressive onboarding: one short question group per step (spec §15–18). */
export function OnboardingPage() {
  const { updateProfile, farmerProfile } = useAppStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [objective, setObjective] = useState<FarmerObjective>(farmerProfile.objective);
  const [method, setMethod] = useState<FarmingMethod>(farmerProfile.method);
  const [farm, setFarm] = useState<Declared>(
    farmerProfile.declared ?? {
      village: "",
      acres: 2,
      irrigation: "drip",
      crop: "Tomato",
      cropAcres: 1,
      sowingDate: "2026-07-01",
      stage: "flowering",
    },
  );
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Declared>(key: K, value: Declared[K]) => setFarm((f) => ({ ...f, [key]: value }));

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1 && !farm.village.trim()) return setError("Enter your village.");
    if (step === 1 && !(farm.acres > 0)) return setError("Enter your farm area.");
    if (step === 2 && (!(farm.cropAcres > 0) || farm.cropAcres > farm.acres)) return setError(`Crop area must be between 0 and ${farm.acres} acres.`);
    setError(null);
    if (step < steps.length - 1) return setStep(step + 1);
    updateProfile({ objective, method, onboarded: true, declared: { ...farm, village: farm.village.trim() } });
    toast("Farm profile saved. Your dashboard is ready.");
    navigate("/farmer");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-6 flex gap-2" aria-label="Setup progress">
        {steps.map((s, i) => (
          <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className={clsx("h-1 rounded-full", i <= step ? "bg-brand-700" : "bg-line")} />
            <div className={clsx("mt-1.5 hidden text-[12px] sm:block", i === step ? "font-medium text-ink" : "text-ink-subtle")}>{s}</div>
          </li>
        ))}
      </ol>
      <p className="text-[12px] text-ink-subtle">
        Step {step + 1} of {steps.length}
      </p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
        {["What do you want from your farm this season?", "Tell us about your farm", "What are you growing?", "How do you farm?"][step]}
      </h1>

      <form onSubmit={next} noValidate>
        <Card className="mt-5 space-y-4 p-5">
          {step === 0 && <ChoiceCards legend="Choose one — you can change it later" name="objective" value={objective} onChange={setObjective} options={objectives} />}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Village" error={error && !farm.village.trim() ? error : null} className="sm:col-span-2">
                {(p) => <TextInput {...p} autoComplete="address-level3" value={farm.village} onChange={(e) => set("village", e.target.value)} />}
              </FormField>
              <FormField label="Farm area (acres)">
                {(p) => <TextInput {...p} type="number" min="0" step="0.5" inputMode="decimal" value={farm.acres} onChange={(e) => set("acres", Number(e.target.value))} />}
              </FormField>
              <FormField label="Irrigation">
                {(p) => (
                  <SelectInput {...p} value={farm.irrigation} onChange={(e) => set("irrigation", e.target.value as IrrigationType)}>
                    <option value="drip">Drip</option>
                    <option value="sprinkler">Sprinkler</option>
                    <option value="flood">Flood / furrow</option>
                    <option value="rainfed">Rainfed</option>
                  </SelectInput>
                )}
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Crop">
                {(p) => (
                  <SelectInput {...p} value={farm.crop} onChange={(e) => set("crop", e.target.value)}>
                    {["Tomato", "Chilli", "Onion", "Leafy vegetables"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </SelectInput>
                )}
              </FormField>
              <FormField label="Area under this crop (acres)" error={error}>
                {(p) => <TextInput {...p} type="number" min="0" step="0.5" inputMode="decimal" value={farm.cropAcres} onChange={(e) => set("cropAcres", Number(e.target.value))} />}
              </FormField>
              <FormField label="Sowing / transplant date">
                {(p) => <TextInput {...p} type="date" value={farm.sowingDate} onChange={(e) => set("sowingDate", e.target.value)} />}
              </FormField>
              <FormField label="Current stage">
                {(p) => (
                  <SelectInput {...p} value={farm.stage} onChange={(e) => set("stage", e.target.value as CropStage)}>
                    {(["nursery", "vegetative", "flowering", "fruit-development", "harvest"] as CropStage[]).map((s) => (
                      <option key={s} value={s}>
                        {stageLabel(s)}
                      </option>
                    ))}
                  </SelectInput>
                )}
              </FormField>
            </div>
          )}

          {step === 3 && (
            <>
              <ChoiceCards
                legend="Choose the closest match"
                name="method"
                value={method}
                onChange={setMethod}
                columns={2}
                options={methods.map((m) => ({ id: m.id, title: m.title, description: m.summary }))}
              />
              <MethodExplainer method={method} />
            </>
          )}
          {error && step === 1 && farm.village.trim() && <p className="text-[12px] text-danger">{error}</p>}
        </Card>

        <div className="mt-5 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => (setStep(step - 1), setError(null))}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate("/farmer")}>
              Skip for now
            </Button>
          )}
          <Button type="submit">{step === steps.length - 1 ? "Save farm profile" : "Continue"}</Button>
        </div>
      </form>
    </div>
  );
}
