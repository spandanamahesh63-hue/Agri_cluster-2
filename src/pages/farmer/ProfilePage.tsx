import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAppStore } from "../../store/AppStore";
import { cluster } from "../../data/mock/cluster";
import { farms } from "../../data/mock/farms";
import { privacySummary } from "../../features/shared/privacy";
import { formatAcres } from "../../utils/format";
import { methods, objectives } from "../../data/mock/planning";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

export function ProfilePage() {
  const { session, farmerProfile, updateProfile, resetDemo } = useAppStore();
  const navigate = useNavigate();
  const toast = useToast();

  return (
    <>
      <PageHeader title="Profile" description="Your account, privacy and preferences." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" />
          <dl className="divide-y divide-line px-5 pb-2 pt-2 text-[13px]">
            {[
              ["Name", session?.name],
              ["Role", "Farmer"],
              ["Cluster", cluster.name],
              ["Farm", `${farms[0].label} · ${farms[0].village} · ${formatAcres(farms[0].totalAcres)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Privacy" subtitle="Control what other cluster members see" />
          <div className="px-5 pb-5 pt-3">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-[13px] font-medium">Show my name to buyers</span>
                <span className="block text-[12px] text-ink-muted">
                  When off, buyers see “Farm #27” on your listings. Experts you contact always see your farm context.
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={farmerProfile.showNameToBuyers}
                onChange={(e) => {
                  updateProfile({ showNameToBuyers: e.target.checked });
                  toast(e.target.checked ? "Buyers will see your name on listings." : "Buyers will see “Farm #27” only.");
                }}
                className="mt-1 size-4 shrink-0 accent-brand-700"
              />
            </label>
            <h3 className="mt-5 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">Who sees what</h3>
            <dl className="mt-2 space-y-2 text-[13px]">
              {privacySummary.map((p) => (
                <div key={p.who}>
                  <dt className="font-medium">{p.who}</dt>
                  <dd className="text-ink-muted">{p.sees}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>

        <Card>
          <CardHeader title="Goal & method" action={<Link to="/farmer/farm" className="text-[13px] font-medium text-brand-700 hover:underline">Change</Link>} />
          <dl className="divide-y divide-line px-5 pb-2 pt-2 text-[13px]">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Goal</dt>
              <dd className="font-medium">{objectives.find((o) => o.id === farmerProfile.objective)?.title}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-muted">Method</dt>
              <dd className="font-medium">{methods.find((m) => m.id === farmerProfile.method)?.title}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Demo data" subtitle="Everything you create is stored only in this browser" />
          <div className="flex flex-wrap gap-2 px-5 pb-5 pt-3">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetDemo();
                navigate("/login");
              }}
            >
              Reset demo
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
