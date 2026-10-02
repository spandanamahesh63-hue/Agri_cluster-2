import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Clock, XCircle } from "lucide-react";
import { roles } from "../../components/navigation/navConfig";
import { Button } from "../../components/ui/Button";
import { BUSINESS } from "../../data/pricing";
import { formatPhone } from "../../services/auth/accounts";
import { accountHome, useAccount } from "../../features/accounts/AccountProvider";
import { formatDate } from "../../utils/format";
import { AuthLayout } from "../auth/AuthLayout";

/** Waiting for approval, or not approved. */
export function AccountStatusPage() {
  const { account, refresh, signOut } = useAccount();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [still, setStill] = useState(false);

  if (account.status === "loading") return <AuthLayout title="Your account">{null}</AuthLayout>;
  if (account.status !== "pending" && account.status !== "rejected") return <Navigate to={accountHome(account)} replace />;
  const p = account.profile;
  const role = roles[p.role].label.toLowerCase();
  const rejected = account.status === "rejected";

  const check = async () => {
    setChecking(true);
    const next = await refresh();
    setChecking(false);
    if (next.status === "ready") navigate(accountHome(next), { replace: true });
    else setStill(true);
  };

  return (
    <AuthLayout title={rejected ? "Not approved" : "Waiting for approval"}>
      <div className="flex items-center gap-2">
        {rejected ? <XCircle aria-hidden className="size-5 text-danger" /> : <Clock aria-hidden className="size-5 text-warning" />}
        <h1 className="text-xl font-semibold tracking-tight">{rejected ? "We couldn't approve this account" : "Waiting for approval"}</h1>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        {rejected
          ? `Our team didn't approve your request to join as ${role}. If you think this is a mistake, contact us at ${BUSINESS.email}.`
          : `Thanks, ${p.name}. Our team checks every ${role} account before it can see farmers' requests. This usually takes up to two working days.`}
      </p>

      <dl className="mt-5 divide-y divide-line rounded-xl border border-line text-[13px]">
        {[
          ["Name", p.name],
          ["Joining as", roles[p.role].label],
          ["Mobile", formatPhone(p.phone)],
          ["Organisation", p.organisation],
          ["Where", p.location],
          ["Sent", formatDate(p.created_at.slice(0, 10))],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
      </dl>

      {!rejected && (
        <>
          <Button className="mt-5 w-full" onClick={() => void check()} disabled={checking}>
            {checking ? "Checking…" : "Check again"}
          </Button>
          {still && (
            <p role="status" className="mt-2 text-center text-[13px] text-ink-muted">
              Not approved yet. We'll keep your request in the queue.
            </p>
          )}
        </>
      )}
      <p className="mt-6 text-center text-[13px] text-ink-muted">
        <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => void signOut().then(() => navigate("/login"))}>
          Sign out
        </button>
      </p>
    </AuthLayout>
  );
}
