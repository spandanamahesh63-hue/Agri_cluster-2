import { useState, type FormEvent } from "react";
import type { Expert, ExpertCategory, Role } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { roles } from "../../components/navigation/navConfig";
import { publicLabel } from "../shared/identity";
import { useExperts } from "../shared/useMerged";
import { expertCategoryLabels } from "../../data/mock/experts";
import { BUSINESS } from "../../data/pricing";
import { formatPhone, friendlyAuthError, updateMyProfile } from "../../services/auth/accounts";
import { useAccount } from "./AccountProvider";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StorageBadge } from "../storage/StorageStatus";
import { FormField, SelectInput, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../utils/format";

/** Profile for real accounts: who you are, how others see you, and your data. */
export function RealProfile({ role, children }: { role: Role; children?: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Profile" description="Your account, how others see you, and your data." />
      <div className="grid gap-6 lg:grid-cols-2">
        <AccountCard role={role} />
        <DataCard />
        {role === "expert" && <ExpertProfileCard />}
        {children}
      </div>
    </>
  );
}

function AccountCard({ role }: { role: Role }) {
  const { session } = useAppStore();
  const { account, setProfile } = useAccount();
  const toast = useToast();
  const p = account.status === "ready" ? account.profile : null;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p?.name ?? "");
  const [location, setLocation] = useState(p?.location ?? "");
  const [error, setError] = useState<string | null>(null);
  if (!p || !session) return null;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Enter your name.");
    try {
      setProfile(await updateMyProfile(p.id, { name: name.trim(), location: location.trim() || undefined }));
      setEditing(false);
      toast("Profile saved.");
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  };

  return (
    <Card>
      <CardHeader
        title="Account"
        action={
          !editing && (
            <Button size="sm" variant="ghost" onClick={() => (setName(p.name), setLocation(p.location ?? ""), setEditing(true))}>
              Edit
            </Button>
          )
        }
      />
      {editing ? (
        <form onSubmit={save} noValidate className="space-y-4 px-5 pb-5 pt-3">
          <FormField label="Your name" error={error ?? undefined}>
            {(f) => <TextInput {...f} autoComplete="name" value={name} onChange={(e) => (setName(e.target.value), setError(null))} />}
          </FormField>
          <FormField label="Village or town">
            {(f) => <TextInput {...f} value={location} onChange={(e) => setLocation(e.target.value)} />}
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save
            </Button>
          </div>
        </form>
      ) : (
        <dl className="divide-y divide-line px-5 pb-2 pt-2 text-[13px]">
          {(
            [
              ["Name", p.name],
              ["Role", roles[role].label],
              ["Mobile", formatPhone(p.phone)],
              ["Village or town", p.location],
              ["Organisation", p.organisation],
              ["Shown to others as", publicLabel(session.userId, role)],
              ["Member since", formatDate(p.created_at.slice(0, 10))],
            ] as [string, string | null][]
          )
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
        </dl>
      )}
    </Card>
  );
}

function DataCard() {
  return (
    <Card>
      <CardHeader title="Your data" action={<StorageBadge />} />
      <div className="space-y-2 px-5 pb-5 pt-3 text-[13px] text-ink-muted">
        <p>Your farm plan and settings are saved in your AgriCluster account. Only you can see them.</p>
        <p>
          A request you send is shared only with the people it is for: a help request with the cluster office, a booking with the machinery owner, a question with that
          expert. Farmers appear to buyers by farm number, not by name.
        </p>
        <p>
          To get a copy of your data or delete your account, email <a href={`mailto:${BUSINESS.email}`} className="font-medium text-brand-700 underline">{BUSINESS.email}</a> from
          anywhere, or ask the cluster office. We reply within 30 days.
        </p>
      </div>
    </Card>
  );
}

const categories = Object.keys(expertCategoryLabels) as ExpertCategory[];

/** Experts publish the profile farmers find on their Experts page. */
function ExpertProfileCard() {
  const { session, update, addExpertProfile } = useAppStore();
  const toast = useToast();
  const existing = useExperts().find((e) => e.userId === session?.userId);
  const [category, setCategory] = useState<ExpertCategory>(existing?.category ?? "crop");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [expertise, setExpertise] = useState(existing?.expertise.join(", ") ?? "");
  const [languages, setLanguages] = useState(existing?.languages.join(", ") ?? "Kannada, English");
  const [fee, setFee] = useState(String(existing?.consultationFee ?? 300));
  const [error, setError] = useState<string | null>(null);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    if (!title.trim()) return setError("Enter your title, for example “Horticulture specialist”.");
    if (list(expertise).length === 0) return setError("List at least one thing you can help with.");
    if (!(Number(fee) >= 0)) return setError("Enter your fee per consultation (0 if free).");
    const profile: Omit<Expert, "id"> = {
      userId: session!.userId,
      name: session!.name,
      category,
      title: title.trim(),
      expertise: list(expertise),
      languages: list(languages),
      responseTime: "Within 2 days",
      consultationFee: Number(fee),
      source: "live",
    };
    if (existing) update("experts", existing.id, profile);
    else addExpertProfile(profile);
    setError(null);
    toast(existing ? "Expert profile updated." : "Expert profile published. Farmers can now find you.");
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Expert profile" subtitle={existing ? "What farmers see on their Experts page" : "Publish this so farmers can find and ask you"} />
      <form onSubmit={save} noValidate className="grid gap-4 px-5 pb-5 pt-3 sm:grid-cols-2">
        <FormField label="Area">
          {(f) => (
            <SelectInput {...f} value={category} onChange={(e) => setCategory(e.target.value as ExpertCategory)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {expertCategoryLabels[c]}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Title">{(f) => <TextInput {...f} placeholder="e.g. Horticulture specialist" value={title} onChange={(e) => setTitle(e.target.value)} />}</FormField>
        <FormField label="What you help with" hint="Separate with commas">
          {(f) => <TextInput {...f} placeholder="Tomato, chilli, leaf curl" value={expertise} onChange={(e) => setExpertise(e.target.value)} />}
        </FormField>
        <FormField label="Languages" hint="Separate with commas">
          {(f) => <TextInput {...f} value={languages} onChange={(e) => setLanguages(e.target.value)} />}
        </FormField>
        <FormField label="Fee per consultation (₹)" hint="Questions through the cluster are free">
          {(f) => <TextInput {...f} type="number" inputMode="numeric" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />}
        </FormField>
        <div className="flex items-end justify-end gap-3 sm:col-span-2">
          {error && (
            <p role="alert" className="mr-auto text-[13px] text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="sm">
            {existing ? "Save changes" : "Publish profile"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
