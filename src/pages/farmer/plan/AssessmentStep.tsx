import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Lock } from "lucide-react";
import type { FarmAssessment, LandReport, Level } from "../../../types";
import { StepLayout } from "../../../features/plan/StepLayout";
import { usePlan } from "../../../features/plan/usePlan";
import { useAppStore } from "../../../store/AppStore";
import { stepHref } from "../../../features/plan/steps";
import { LandDetailsHelp } from "../../../features/support/LandDetailsHelp";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { InfoNote } from "../../../components/ui/Badge";
import { ChoiceCards, FormField, SelectInput, TextInput } from "../../../components/forms/fields";
import { useToast } from "../../../components/ui/Toast";
import { formatINR } from "../../../utils/format";

const parts = ["You and your farm", "Water, energy and resources", "Money and experience"];
const levels: { id: Level; title: string }[] = [
  { id: "low", title: "Low" },
  { id: "moderate", title: "Moderate" },
  { id: "high", title: "Good" },
];

/** Step 1 — farm assessment (spec §6). Only questions that change a later recommendation. */
export function AssessmentStep() {
  const p = usePlan();
  const { session, updateProfile } = useAppStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [part, setPart] = useState(0);
  const [a, setA] = useState<FarmAssessment>(p.assessment);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof FarmAssessment>(k: K, v: FarmAssessment[K]) => {
    setA((x) => ({ ...x, [k]: v }));
    setError(null);
  };
  /** Fill in whatever the cluster office's land report recorded; keep the rest. */
  const applyReport = (r: LandReport) => {
    setA((x) => ({
      ...x,
      ...(r.soilType && { soilType: r.soilType }),
      ...(r.water && { water: r.water }),
      ...(r.irrigation && { irrigation: r.irrigation }),
      ...(r.landAcres && { landAcres: r.landAcres }),
      ...(r.soilTestDone !== undefined && { soilTestDone: r.soilTestDone }),
    }));
    setError(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (part === 0) {
      if (!a.name.trim()) return setError("Please enter your name.");
      if (!a.location.trim()) return setError("Please enter where your farm is.");
      if (!(a.landAcres > 0)) return setError("Please enter your land size.");
    }
    if (part === 2 && !(a.investment >= 0)) return setError("Please enter the amount you can invest (0 is fine).");
    if (part < parts.length - 1) return setPart(part + 1);
    p.updatePlan({ assessment: { ...a, name: a.name.trim(), location: a.location.trim() } });
    updateProfile({ onboarded: true });
    toast("Farm details saved.");
    navigate(stepHref("vision"));
  };

  return (
    <StepLayout
      step="assessment"
      description={
        session?.mode === "real"
          ? "We only ask what changes a later recommendation. Not sure about something? Fill in your best guess, or ask us for help below."
          : "We only ask what changes a later recommendation. Sample answers for Spandana's farm are filled in; change anything."
      }
      action={
        <div className="flex gap-2">
          {part > 0 && (
            <Button variant="ghost" onClick={() => setPart(part - 1)}>
              Previous part
            </Button>
          )}
          <Button type="submit" form="assessment">
            {part < parts.length - 1 ? `Continue to ${parts[part + 1].toLowerCase()}` : "Save farm details"}
          </Button>
        </div>
      }
      aside={
        <Card className="p-5 text-[13px]">
          <div className="flex items-center gap-2 font-medium">
            <Lock aria-hidden className="size-4 text-ink-subtle" />
            Your details stay private
          </div>
          <p className="mt-1 text-ink-muted">
            Buyers, labour and providers never see your contact details, investment or loan needs. See Profile → Privacy for who sees what.
          </p>
        </Card>
      }
    >
      <ol className="flex gap-2 text-[12px]" aria-label="Assessment parts">
        {parts.map((label, i) => (
          <li key={label} aria-current={i === part ? "step" : undefined} className="flex-1">
            <div className={clsx("h-1 rounded-full", i <= part ? "bg-brand-600" : "bg-line")} />
            <div className={clsx("mt-1 hidden sm:block", i === part ? "font-medium text-ink" : "text-ink-subtle")}>{label}</div>
          </li>
        ))}
      </ol>

      <form id="assessment" onSubmit={submit} noValidate>
        <Card className="space-y-5 p-5">
          <h2 className="text-[15px] font-semibold">{parts[part]}</h2>

          {part === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Your name">{(f) => <TextInput {...f} autoComplete="name" value={a.name} onChange={(e) => set("name", e.target.value)} />}</FormField>
              <FormField label="Mobile or email" hint="Optional. Only you see it.">
                {(f) => <TextInput {...f} autoComplete="tel" value={a.contact} onChange={(e) => set("contact", e.target.value)} />}
              </FormField>
              <FormField label="Farm location" hint="Village or town, district">
                {(f) => <TextInput {...f} value={a.location} onChange={(e) => set("location", e.target.value)} />}
              </FormField>
              <FormField label="Land size (acres)" hint="Sets costs, yields and labour needs">
                {(f) => <TextInput {...f} type="number" inputMode="decimal" min="0" step="0.5" value={a.landAcres} onChange={(e) => set("landAcres", Number(e.target.value))} />}
              </FormField>
              <FormField label="Do you own or lease the land?">
                {(f) => (
                  <SelectInput {...f} value={a.tenure} onChange={(e) => set("tenure", e.target.value as FarmAssessment["tenure"])}>
                    <option value="owned">Own</option>
                    <option value="leased">Lease</option>
                  </SelectInput>
                )}
              </FormField>
              <FormField label="Soil type" hint="Some crops grow poorly in some soils">
                {(f) => (
                  <SelectInput {...f} value={a.soilType} onChange={(e) => set("soilType", e.target.value as FarmAssessment["soilType"])}>
                    <option value="red">Red</option>
                    <option value="black">Black</option>
                    <option value="alluvial">Alluvial</option>
                    <option value="sandy">Sandy</option>
                    <option value="laterite">Laterite</option>
                  </SelectInput>
                )}
              </FormField>
              <FormField label="Current crop">{(f) => <TextInput {...f} value={a.currentCrop} onChange={(e) => set("currentCrop", e.target.value)} />}</FormField>
              <FormField label="Previous crop" hint="Helps with rotation and experience">
                {(f) => <TextInput {...f} value={a.previousCrop} onChange={(e) => set("previousCrop", e.target.value)} />}
              </FormField>
              <label className="flex items-center gap-2 text-[13px] sm:col-span-2">
                <input type="checkbox" className="size-4 accent-brand-700" checked={a.soilTestDone} onChange={(e) => set("soilTestDone", e.target.checked)} />
                I have a soil test from the last 2 years
              </label>
            </div>
          )}

          {part === 1 && (
            <div className="space-y-5">
              <ChoiceCards<Level> legend="How much water do you have for irrigation?" name="water" value={a.water} onChange={(v) => set("water", v)} options={levels} columns={3} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Irrigation">
                  {(f) => (
                    <SelectInput {...f} value={a.irrigation} onChange={(e) => set("irrigation", e.target.value as FarmAssessment["irrigation"])}>
                      <option value="drip">Drip</option>
                      <option value="sprinkler">Sprinkler</option>
                      <option value="flood">Flood / furrow</option>
                      <option value="rainfed">Rainfed only</option>
                    </SelectInput>
                  )}
                </FormField>
                <FormField label="Electricity for the pump">
                  {(f) => (
                    <SelectInput {...f} value={a.electricity} onChange={(e) => set("electricity", e.target.value as FarmAssessment["electricity"])}>
                      <option value="reliable">Most of the day</option>
                      <option value="limited">A few hours a day</option>
                      <option value="none">None</option>
                    </SelectInput>
                  )}
                </FormField>
              </div>
              <div className="grid gap-2 text-[13px] sm:grid-cols-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="size-4 accent-brand-700" checked={a.solar} onChange={(e) => set("solar", e.target.checked)} />
                  I have a solar pump or panels
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="size-4 accent-brand-700" checked={a.ownsMachinery} onChange={(e) => set("ownsMachinery", e.target.checked)} />
                  I own a tractor or other machinery
                </label>
              </div>
              <ChoiceCards<Level> legend="How easy is it to find farm labour?" name="labour" value={a.labourAvailable} onChange={(v) => set("labourAvailable", v)} options={levels} columns={3} />
            </div>
          )}

          {part === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Money you can invest this season (₹)" hint={a.investment > 0 ? formatINR(a.investment) : "Sets which crops and methods fit"}>
                  {(f) => <TextInput {...f} type="number" inputMode="numeric" min="0" step="5000" value={a.investment} onChange={(e) => set("investment", Number(e.target.value))} />}
                </FormField>
                <FormField label="Years of farming experience">
                  {(f) => <TextInput {...f} type="number" inputMode="numeric" min="0" value={a.experienceYears} onChange={(e) => set("experienceYears", Number(e.target.value))} />}
                </FormField>
              </div>
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" className="size-4 accent-brand-700" checked={a.needsLoan} onChange={(e) => set("needsLoan", e.target.checked)} />
                I may need a loan or financial support
              </label>
              <ChoiceCards<Level>
                legend="How comfortable are you with phones, apps and sensors?"
                name="tech"
                value={a.techFamiliarity}
                onChange={(v) => set("techFamiliarity", v)}
                options={[
                  { id: "low", title: "Not very", description: "Keep it simple" },
                  { id: "moderate", title: "Somewhat", description: "I use WhatsApp and apps" },
                  { id: "high", title: "Very", description: "Happy with sensors and data" },
                ]}
                columns={3}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}
          {part < 2 && <LandDetailsHelp phone={a.contact} place={a.location} onApply={applyReport} />}
          <InfoNote>Answers are used only for rule-based suggestions in this prototype.</InfoNote>
        </Card>
      </form>
    </StepLayout>
  );
}
