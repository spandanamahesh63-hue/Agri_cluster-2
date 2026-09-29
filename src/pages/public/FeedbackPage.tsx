import { useId, useState, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import { CircleCheck, Copy, Lock, Star } from "lucide-react";
import { PublicLayout } from "./PublicPages";
import { cloudConfigured, sendFeedback, type FeedbackRow } from "../../services/storage/cloud";
import { BUSINESS } from "../../data/pricing";
import { Card } from "../../components/ui/Card";
import { InfoNote } from "../../components/ui/Badge";
import { Button, ButtonLink } from "../../components/ui/Button";
import { SelectInput, TextArea, TextInput } from "../../components/forms/fields";

// Optional: a Google Form (or similar) to use when the database isn't available.
// Leave empty to offer "Copy my answers" + the support email instead.
const FALLBACK_FORM_URL = "";

const roles = ["Farmer", "Buyer", "Machinery / tech owner", "Labour", "Expert", "Community organiser", "Cluster / FPO staff", "Judge or evaluator", "Just exploring"];
const featureOptions = [
  "Season planning",
  "Crop and method suggestions",
  "Investment planner",
  "Market and buyers",
  "Machinery and technology",
  "Labour",
  "Experts",
  "Government and private support",
  "Community",
  "Notifications",
];
const MAX = 1000;

type Status = "idle" | "sending" | "sent" | "failed";

/** Anonymous feedback form (stored in the feedback table; see supabase/feedback.sql). */
export function FeedbackPage() {
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(0);
  const [ease, setEase] = useState<number | null>(null);
  const [usefulness, setUsefulness] = useState<number | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [wantsReply, setWantsReply] = useState(false);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: people never see or fill this
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  const online = cloudConfigured;

  const row = (): FeedbackRow => ({
    role,
    rating,
    ease,
    usefulness,
    features,
    experience: experience.trim() || null,
    suggestions: suggestions.trim() || null,
    contact_email: wantsReply && email.trim() ? email.trim() : null,
    source: "website",
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!role) e.role = "Choose the option that describes you best.";
    if (!rating) e.rating = "Choose a rating from 1 to 5 stars.";
    if (wantsReply && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = "Enter a valid email, or untick “I'd like a reply”.";
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(e.role ? "fb-role" : e.rating ? "fb-rating" : "fb-email")?.focus();
      return false;
    }
    return true;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (website) {
      setStatus("sent"); // a bot filled the hidden field; pretend success, store nothing
      return;
    }
    setStatus("sending");
    try {
      await sendFeedback(row());
      setStatus("sent");
      window.scrollTo(0, 0);
    } catch {
      setStatus("failed");
    }
  };

  const summary = () => {
    const r = row();
    return [
      "AgriCluster feedback",
      `Role: ${r.role}`,
      `Overall rating: ${r.rating}/5`,
      `Ease of use: ${r.ease ?? "-"}/5`,
      `Usefulness: ${r.usefulness ?? "-"}/5`,
      `Most useful: ${r.features.join(", ") || "-"}`,
      `Experience: ${r.experience ?? "-"}`,
      `Suggestions: ${r.suggestions ?? "-"}`,
      ...(r.contact_email ? [`Reply to: ${r.contact_email}`] : []),
    ].join("\n");
  };

  const copy = () => {
    if (!validate()) return;
    navigator.clipboard?.writeText(summary()).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  if (status === "sent")
    return (
      <PublicLayout title="Share your feedback">
        <Card className="mt-6 max-w-xl p-6 text-center" role="status">
          <CircleCheck aria-hidden className="mx-auto size-10 text-success" />
          <h2 className="mt-3 text-lg font-semibold">Thank you for your feedback!</h2>
          <p className="mt-1 text-[14px] text-ink-muted">
            The AgriCluster team reads every response. {wantsReply && email ? "We'll reply to the email you gave." : "Your response was sent anonymously."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <ButtonLink to="/login">Back to AgriCluster</ButtonLink>
          </div>
        </Card>
      </PublicLayout>
    );

  return (
    <PublicLayout title="Share your feedback">
      <p className="mt-2 max-w-2xl text-[15px] text-ink-muted">Tell us what works and what doesn't. It takes about two minutes.</p>
      <div className="mt-3 flex max-w-2xl gap-2 rounded-lg bg-surface px-3 py-2.5 text-[13px] text-ink-muted ring-1 ring-line">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>Anonymous by default. We don't ask for your name or phone number, and nothing links your answers to your demo.</span>
      </div>

      <form onSubmit={submit} noValidate className="mt-6 max-w-2xl space-y-5">
        <Card className="space-y-6 p-5 sm:p-6">
          <Field id="fb-role" label="Which describes you best?" required error={errors.role}>
            {(p) => (
              <SelectInput {...p} value={role} onChange={(e) => (setRole(e.target.value), setErrors((x) => ({ ...x, role: "" })))}>
                <option value="">Choose one</option>
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </SelectInput>
            )}
          </Field>

          <StarRating value={rating} onChange={(v) => (setRating(v), setErrors((x) => ({ ...x, rating: "" })))} error={errors.rating} />

          <Scale name="ease" legend="How easy was AgriCluster to use?" low="Very hard" high="Very easy" value={ease} onChange={setEase} />
          <Scale name="usefulness" legend="How useful would it be for farmers?" low="Not useful" high="Very useful" value={usefulness} onChange={setUsefulness} />

          <fieldset>
            <legend className="text-[14px] font-medium">Which features did you find most useful?</legend>
            <p className="text-[12px] text-ink-subtle">Choose any</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {featureOptions.map((f) => (
                <label key={f} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-700"
                    checked={features.includes(f)}
                    onChange={() => setFeatures((l) => (l.includes(f) ? l.filter((x) => x !== f) : [...l, f]))}
                  />
                  {f}
                </label>
              ))}
            </div>
          </fieldset>

          <Field id="fb-experience" label="How was your overall experience?" hint={`Optional · ${experience.length}/${MAX}`}>
            {(p) => <TextArea {...p} rows={3} maxLength={MAX} value={experience} onChange={(e) => setExperience(e.target.value)} />}
          </Field>
          <Field id="fb-suggestions" label="What should we improve or add?" hint={`Optional · ${suggestions.length}/${MAX}`}>
            {(p) => <TextArea {...p} rows={3} maxLength={MAX} value={suggestions} onChange={(e) => setSuggestions(e.target.value)} />}
          </Field>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" className="size-4 accent-brand-700" checked={wantsReply} onChange={(e) => setWantsReply(e.target.checked)} />
              I'd like a reply (optional)
            </label>
            {wantsReply && (
              <Field id="fb-email" label="Your email" hint="Used only to reply to this feedback" error={errors.email}>
                {(p) => <TextInput {...p} type="email" inputMode="email" autoComplete="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />}
              </Field>
            )}
          </div>

          {/* Honeypot: hidden from people and screen readers */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>
        </Card>

        {online ? (
          <>
            {status === "failed" && (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
                Your feedback couldn't be sent. Check your internet connection and try again, or copy your answers and email them to{" "}
                <span className="font-medium">{BUSINESS.email}</span>.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send feedback"}
              </Button>
              {status === "failed" && (
                <Button variant="ghost" icon={<Copy aria-hidden className="size-4" />} onClick={copy}>
                  {copied ? "Copied" : "Copy my answers"}
                </Button>
              )}
            </div>
          </>
        ) : (
          <OfflineSend onCopy={copy} copied={copied} />
        )}
      </form>
    </PublicLayout>
  );
}

/** When there's no database here (offline file, embedded preview): a working alternative, not a dead button. */
function OfflineSend({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  return (
    <Card className="space-y-3 p-5 text-[14px]">
      <p className="font-medium">This copy of AgriCluster can't send feedback directly.</p>
      {FALLBACK_FORM_URL ? (
        <a href={FALLBACK_FORM_URL} target="_blank" rel="noreferrer" className="font-medium text-brand-700 underline">
          Open the feedback form (opens in a new tab)
        </a>
      ) : (
        <>
          <p className="text-ink-muted">
            Copy your answers and email them to <span className="font-medium text-ink">{BUSINESS.email}</span>, or use the online version of AgriCluster.
          </p>
          <Button icon={<Copy aria-hidden className="size-4" />} onClick={onCopy}>
            {copied ? "Copied. Paste into an email" : "Copy my answers"}
          </Button>
        </>
      )}
      <InfoNote>Nothing is sent from this page until you choose to.</InfoNote>
    </Card>
  );
}

function Field({ id, label, hint, error, required, children }: { id: string; label: string; hint?: string; error?: string; required?: boolean; children: (p: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode }) {
  const msg = `${id}-msg`;
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <div className="mt-1.5">{children({ id, "aria-invalid": !!error || undefined, "aria-describedby": error || hint ? msg : undefined })}</div>
      {(error || hint) && (
        <p id={msg} className={clsx("mt-1 text-[12px]", error ? "text-danger" : "text-ink-subtle")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

const starWords = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function StarRating({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const msg = useId();
  return (
    <fieldset aria-describedby={error ? msg : undefined}>
      <legend className="text-[14px] font-medium">
        Overall, how would you rate AgriCluster?<span className="text-danger"> *</span>
      </legend>
      <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200" onMouseEnter={() => setHover(n)}>
            <input
              id={n === 1 ? "fb-rating" : undefined}
              type="radio"
              name="rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <Star aria-hidden className={clsx("size-8 transition-colors", n <= shown ? "fill-amber-400 text-amber-500" : "text-line-strong")} />
            <span className="sr-only">
              {n} star{n > 1 ? "s" : ""}, {starWords[n]}
            </span>
          </label>
        ))}
        <span className="ml-2 text-[13px] text-ink-muted" aria-hidden>
          {shown ? starWords[shown] : ""}
        </span>
      </div>
      {error && (
        <p id={msg} className="mt-1 text-[12px] text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Scale({ name, legend, low, high, value, onChange }: { name: string; legend: string; low: string; high: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <fieldset>
      <legend className="text-[14px] font-medium">{legend}</legend>
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="grid h-10 flex-1 cursor-pointer place-items-center rounded-lg border border-line text-[14px] font-medium has-[:checked]:border-brand-700 has-[:checked]:bg-brand-700 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200"
          >
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            {n}
            <span className="sr-only">{n === 1 ? ` (${low})` : n === 5 ? ` (${high})` : ""}</span>
          </label>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[12px] text-ink-subtle">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}
