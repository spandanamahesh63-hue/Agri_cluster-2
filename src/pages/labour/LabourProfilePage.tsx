import { useState, type FormEvent } from "react";
import type { LabourProfile, LabourSkill } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { useLabour } from "../../features/labour/useLabour";
import { skillLabels } from "../../data/mock/labour";
import { villageNames } from "../../data/mock/clusterFarms";
import { cropCatalogue } from "../../data/catalog/crops";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/states";
import { ChoiceCards, FormField, SelectInput, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";

export function LabourProfilePage() {
  const { profile } = useLabour();
  if (!profile) return <EmptyState title="No labour profile found" />;
  return (
    <>
      <PageHeader title="Profile" description="Your skills, availability and location — this is what farmers see when they search." />
      <ProfileForm profile={profile} />
    </>
  );
}

function ProfileForm({ profile }: { profile: LabourProfile }) {
  const { editLabour } = useAppStore();
  const toast = useToast();
  const [skills, setSkills] = useState<LabourSkill[]>(profile.skills);
  const [crewSize, setCrewSize] = useState(String(profile.crewSize));
  const [wage, setWage] = useState(String(profile.dailyWage));
  const [village, setVillage] = useState(profile.village);
  const [availability, setAvailability] = useState(profile.availability);
  const [from, setFrom] = useState(profile.availableFrom);
  const [hourly, setHourly] = useState(profile.hourlyRate ? String(profile.hourlyRate) : "");
  const [experience, setExperience] = useState(String(profile.experienceYears));
  const [crops, setCrops] = useState<string[]>(profile.cropExperience);
  const [transport, setTransport] = useState(profile.transport);
  const [error, setError] = useState<string | null>(null);

  const toggle = (s: LabourSkill) => setSkills((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));
  const toggleCrop = (c: string) => setCrops((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (skills.length === 0) return setError("Choose at least one skill.");
    if (!(Number(crewSize) > 0)) return setError("Crew size must be at least 1.");
    if (!(Number(wage) > 0)) return setError("Enter a daily wage per worker.");
    setError(null);
    editLabour(profile.id, {
      skills,
      crewSize: Number(crewSize),
      dailyWage: Number(wage),
      hourlyRate: Number(hourly) > 0 ? Number(hourly) : undefined,
      experienceYears: Math.max(0, Number(experience) || 0),
      cropExperience: crops,
      transport,
      village,
      availability,
      availableFrom: from,
      label: `${skills.includes("harvesting") ? "Harvest crew" : "Field crew"} · ${village}`,
    });
    toast("Profile updated. Farmers now see your new details.");
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-3">
      <Card className="space-y-5 p-5 lg:col-span-2">
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium">Skills</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(skillLabels) as LabourSkill[]).map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-line-strong px-3 py-1.5 text-[13px] has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200"
              >
                <input type="checkbox" className="accent-brand-700" checked={skills.includes(s)} onChange={() => toggle(s)} />
                {skillLabels[s]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Crew size">
            {(p) => <TextInput {...p} type="number" min="1" inputMode="numeric" value={crewSize} onChange={(e) => setCrewSize(e.target.value)} />}
          </FormField>
          <FormField label="Daily wage per worker (₹)">
            {(p) => <TextInput {...p} type="number" inputMode="numeric" value={wage} onChange={(e) => setWage(e.target.value)} />}
          </FormField>
          <FormField label="Village">
            {(p) => (
              <SelectInput {...p} value={village} onChange={(e) => setVillage(e.target.value)}>
                {villageNames.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </SelectInput>
            )}
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Hourly rate per worker (₹)" hint="Optional, for short jobs">
            {(p) => <TextInput {...p} type="number" inputMode="numeric" value={hourly} onChange={(e) => setHourly(e.target.value)} />}
          </FormField>
          <FormField label="Years of experience">
            {(p) => <TextInput {...p} type="number" min="0" inputMode="numeric" value={experience} onChange={(e) => setExperience(e.target.value)} />}
          </FormField>
          <label className="flex items-center gap-2 self-end pb-2 text-[13px]">
            <input type="checkbox" className="size-4 accent-brand-700" checked={transport} onChange={(e) => setTransport(e.target.checked)} />
            Crew has its own transport
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium">Crops you have worked with</legend>
          <div className="flex flex-wrap gap-2">
            {cropCatalogue.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-line-strong px-3 py-1.5 text-[13px] has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200"
              >
                <input type="checkbox" className="accent-brand-700" checked={crops.includes(c.name)} onChange={() => toggleCrop(c.name)} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <ChoiceCards<LabourProfile["availability"]>
          legend="Availability"
          name="availability"
          value={availability}
          onChange={setAvailability}
          columns={3}
          options={[
            { id: "available", title: "Available", description: "Taking new work" },
            { id: "limited", title: "Limited", description: "A few days only" },
            { id: "booked", title: "Fully booked", description: "Not taking new work" },
          ]}
        />
        <FormField label="Available from" className="max-w-xs">
          {(p) => <TextInput {...p} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />}
        </FormField>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </Card>
      <aside className="space-y-4">
        <Card className="p-5 text-[13px]">
          <div className="font-medium">{profile.leadName}</div>
          <div className="text-ink-muted">Crew lead · {profile.label}</div>
          <InfoNote className="mt-3">Farmers see your crew label, skills, crops, experience, rates, transport and availability. They don't see your phone number.</InfoNote>
        </Card>
        <Button type="submit" className="w-full">
          Save profile
        </Button>
      </aside>
    </form>
  );
}
