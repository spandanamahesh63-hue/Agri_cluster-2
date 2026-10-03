import { Card } from "../../components/ui/Card";
import { ButtonLink } from "../../components/ui/Button";

/** Real crews and experts are invisible to farmers until they publish a profile. */
export function PublishProfileBanner({ what, to }: { what: string; to: string }) {
  return (
    <Card className="mb-6 flex flex-col gap-3 border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-brand-900">Farmers can't find you yet</div>
        <p className="text-[13px] text-brand-800">Publish your {what} so farmers can find you and send requests.</p>
      </div>
      <ButtonLink to={to} size="sm">
        Publish my profile
      </ButtonLink>
    </Card>
  );
}
