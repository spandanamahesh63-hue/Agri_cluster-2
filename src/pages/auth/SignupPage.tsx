import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Role } from "../../types";
import { roleHome } from "../../components/navigation/navConfig";
import { useAppStore } from "../../store/AppStore";
import { cluster } from "../../data/mock/cluster";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { AuthLayout } from "./AuthLayout";
import { RoleSelect } from "./RoleSelect";

export function SignupPage() {
  const { signUp } = useAppStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("farmer");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Enter your name so cluster members know who they are working with.");
      return;
    }
    signUp(role, name);
    navigate(role === "farmer" ? "/farmer/plan/assessment" : roleHome(role));
  };

  return (
    <AuthLayout title="Join a cluster">
      <h1 className="text-xl font-semibold tracking-tight">Join a cluster</h1>
      <p className="mt-1 text-sm text-ink-muted">Two quick details now. Farm and crop details come later, one step at a time.</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium">
            Your name
          </label>
          <input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "name-error" : undefined}
            className="h-10 w-full rounded-lg border border-line-strong px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          {error && (
            <p id="name-error" className="mt-1.5 text-[12px] text-danger">
              {error}
            </p>
          )}
        </div>

        <RoleSelect value={role} onChange={setRole} />

        <div className="rounded-lg bg-canvas px-3 py-2.5 text-[13px]">
          <span className="text-ink-muted">Cluster: </span>
          <span className="font-medium">{cluster.name}</span>
          <span className="text-ink-muted"> · {cluster.region}</span>
        </div>

        <Button type="submit" className="w-full">
          Create account
        </Button>
        <InfoNote>
          Prototype: your account uses the demo profile for the selected role so every screen has data to show.
        </InfoNote>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already a member?{" "}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
