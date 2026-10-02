import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { accountsEnabled } from "../../services/auth/accounts";
import { accountHome, useAccount } from "../../features/accounts/AccountProvider";
import { PhoneSignIn } from "../../features/accounts/PhoneSignIn";
import { ChevronRight } from "lucide-react";
import type { Role } from "../../types";
import { roleHome, roleList } from "../../components/navigation/navConfig";
import { useAppStore } from "../../store/AppStore";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { AuthLayout } from "./AuthLayout";
import { RoleSelect } from "./RoleSelect";
import { DemoGuideButton } from "../../features/demo/DemoGuide";

export function LoginPage() {
  return accountsEnabled ? <RealLogin /> : <DemoLogin />;
}

/** Real accounts: phone sign-in first, the demo below it. */
function RealLogin() {
  const { account } = useAccount();
  if (account.status === "loading") return <AuthLayout title="Sign in">{null}</AuthLayout>;
  if (account.status !== "signed-out" && account.status !== "error" && account.status !== "off") return <Navigate to={accountHome(account)} replace />;

  return (
    <AuthLayout title="Sign in">
      <div className="agri-header">
        <h1 className="text-xl font-semibold tracking-tight">Sign in or join</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Farmers can start straight away. Cluster office, buyers, providers, labour, experts and community organisers are checked by our team first.
        </p>
      </div>
      {account.status === "error" && <InfoNote className="mt-4">{account.error}</InfoNote>}
      <div className="mt-6">
        <PhoneSignIn />
      </div>
      <p className="mt-4 text-[12px] text-ink-subtle">
        By signing in you agree to the{" "}
        <Link to="/terms" className="underline">
          terms
        </Link>{" "}
        and the{" "}
        <Link to="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>

      <div className="my-7 flex items-center gap-3 text-[12px] text-ink-subtle">
        <div className="h-px flex-1 bg-line" />
        or look around first
        <div className="h-px flex-1 bg-line" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Try the demo</h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">Sample farms and people. Nothing you do there is saved to an account.</p>
        </div>
        <DemoGuideButton label="Guided demo" />
      </div>
      <DemoRoles />
    </AuthLayout>
  );
}

function DemoRoles() {
  const { signInAsDemo } = useAppStore();
  const navigate = useNavigate();
  const enterDemo = (r: Role) => {
    signInAsDemo(r);
    navigate(roleHome(r));
  };
  return (
    <ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
      {roleList.map((r) => (
        <li key={r.role}>
          <button type="button" onClick={() => enterDemo(r.role)} className="group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <r.icon aria-hidden className="size-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{r.label}</span>
              <span className="block truncate text-[12px] text-ink-muted">{r.tagline}</span>
            </span>
            <ChevronRight aria-hidden className="size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function DemoLogin() {
  const { signInAsDemo } = useAppStore();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("farmer");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    signInAsDemo(role);
    navigate(roleHome(role));
  };

  return (
    <AuthLayout title="Sign in">
      <div className="agri-header flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Demo access</h1>
          <p className="mt-1 text-sm text-ink-muted">Explore the prototype as any member of the Mysuru Vegetable Cluster.</p>
        </div>
        <DemoGuideButton label="Guided demo" />
      </div>

      <DemoRoles />

      <div className="my-7 flex items-center gap-3 text-[12px] text-ink-subtle">
        <div className="h-px flex-1 bg-line" />
        or sign in
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-[13px] font-medium">
            Mobile number
          </label>
          <div className="flex rounded-lg border border-line-strong focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <span className="flex items-center border-r border-line px-3 text-sm text-ink-muted">+91</span>
            <input
              id="phone"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "phone-error" : undefined}
              placeholder="98450 12345"
              className="h-10 w-full rounded-r-lg bg-transparent px-3 text-sm outline-none"
            />
          </div>
          {error && (
            <p id="phone-error" className="mt-1.5 text-[12px] text-danger">
              {error}
            </p>
          )}
        </div>
        <RoleSelect value={role} onChange={setRole} compact />
        <Button type="submit" className="w-full">
          Sign in
        </Button>
        <InfoNote>
          Sign-in is simulated in this prototype: no OTP is sent and no password is used. Please don't enter real personal details. See the{" "}
          <Link to="/privacy" className="underline">
            privacy policy
          </Link>{" "}
          for where demo data is saved.
        </InfoNote>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New to AgriCluster?{" "}
        <Link to="/signup" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
