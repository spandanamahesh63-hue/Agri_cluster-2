import { useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { Role } from "../../types";
import { roles } from "../../components/navigation/navConfig";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { FormField, TextArea, TextInput } from "../../components/forms/fields";
import { createProfile, friendlyAuthError } from "../../services/auth/accounts";
import { accountHome, useAccount } from "../../features/accounts/AccountProvider";
import { AuthLayout } from "../auth/AuthLayout";
import { RoleSelect } from "../auth/RoleSelect";

/** First sign-in: who you are and how you'll use AgriCluster. */
export function WelcomePage() {
  const { account, setProfile, signOut } = useAccount();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("farmer");
  const [organisation, setOrganisation] = useState("");
  const [location, setLocation] = useState("");
  const [about, setAbout] = useState("");
  const [errors, setErrors] = useState<{ name?: string; location?: string; about?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  // Set once the profile is saved, so this page sends the person on itself.
  const saved = useRef(false);

  if (account.status === "loading") return <AuthLayout title="Welcome">{null}</AuthLayout>;
  if (account.status !== "needs-profile" && !saved.current) return <Navigate to={accountHome(account)} replace />;
  const farmer = role === "farmer";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (account.status !== "needs-profile") return;
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Enter your name.";
    if (!location.trim()) next.location = farmer ? "Enter your village or town." : "Enter where you work.";
    if (!farmer && about.trim().length < 10) next.about = "Tell us a little about your work, so our team can approve you.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const p = await createProfile(account.userId, { name, role, organisation: farmer ? undefined : organisation, location, about: farmer ? undefined : about });
      saved.current = true;
      setProfile(p);
      navigate(p.status === "approved" ? (p.role === "farmer" ? "/farmer/plan/assessment" : accountHome({ status: "ready", userId: p.id, profile: p })) : "/account/status", { replace: true });
    } catch (err) {
      setErrors({ form: friendlyAuthError(err) });
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome">
      <h1 className="text-xl font-semibold tracking-tight">Welcome to AgriCluster</h1>
      <p className="mt-1 text-sm text-ink-muted">A few details so the cluster knows who you are. You can change your name and place later.</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <FormField label="Your name" error={errors.name}>
          {(f) => <TextInput {...f} autoComplete="name" value={name} onChange={(e) => (setName(e.target.value), setErrors((x) => ({ ...x, name: undefined })))} />}
        </FormField>
        <RoleSelect value={role} onChange={(r) => (setRole(r), setErrors({}))} />
        {!farmer && (
          <FormField label="Business or organisation" hint="Optional">
            {(f) => <TextInput {...f} autoComplete="organization" value={organisation} onChange={(e) => setOrganisation(e.target.value)} />}
          </FormField>
        )}
        <FormField label={farmer ? "Village or town" : "Where you work"} hint="Village or town, district" error={errors.location}>
          {(f) => <TextInput {...f} value={location} onChange={(e) => (setLocation(e.target.value), setErrors((x) => ({ ...x, location: undefined })))} />}
        </FormField>
        {!farmer && (
          <FormField label="About your work" hint={`What you do as ${roles[role].label.toLowerCase()}. Our team reads this before approving you.`} error={errors.about}>
            {(f) => <TextArea {...f} rows={3} maxLength={500} value={about} onChange={(e) => (setAbout(e.target.value), setErrors((x) => ({ ...x, about: undefined })))} />}
          </FormField>
        )}
        {!farmer && <InfoNote>Our team approves {roles[role].label.toLowerCase()} accounts before they can see farmers' requests. We'll check within two working days.</InfoNote>}
        {errors.form && (
          <p role="alert" className="text-[13px] text-danger">
            {errors.form}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Saving…" : farmer ? "Start planning my farm" : "Send for approval"}
        </Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-ink-muted">
        Wrong number?{" "}
        <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => void signOut().then(() => navigate("/login"))}>
          Sign out
        </button>
      </p>
    </AuthLayout>
  );
}
