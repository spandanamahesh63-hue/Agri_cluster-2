import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { useFarmerOverview } from "../../features/farmer/useFarmerOverview";
import { domainMeta } from "../../features/intelligence/domain";
import { EvidenceList } from "../../features/intelligence/EvidenceList";
import { DecisionControls } from "../../features/intelligence/DecisionControls";
import { HowItWorks } from "../../features/intelligence/HowItWorks";
import { Badge, InfoNote, PriorityBadge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, PageSkeleton } from "../../components/ui/states";

/** Full reasoning for one recommendation (spec §5 / §55). */
export function RecommendationDetailPage() {
  const { id } = useParams();
  const overview = useFarmerOverview();

  if (overview.status === "loading") return <PageSkeleton />;
  if (overview.status === "error") return <ErrorState message={overview.error.message} onRetry={overview.retry} />;

  const rec = overview.data.recommendations.find((r) => r.id === id);
  const back = (
    <Link to="/farmer/intelligence" className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
      <ArrowLeft aria-hidden className="size-3.5" />
      Intelligence
    </Link>
  );

  if (!rec) {
    return (
      <>
        {back}
        <Card>
          <EmptyState
            title="This suggestion is no longer active"
            description="Conditions may have changed since it was generated."
            action={
              <ButtonLink to="/farmer/intelligence" variant="secondary" size="sm">
                View current suggestions
              </ButtonLink>
            }
          />
        </Card>
      </>
    );
  }

  const domain = domainMeta[rec.domain];
  const field = overview.data.fields.find((f) => f.id === rec.fieldId);

  return (
    <>
      {back}
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="space-y-6 lg:col-span-2">
          <header>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge tone={domain.tone} icon={<domain.icon aria-hidden className="size-3" />}>
                {domain.label}
              </Badge>
              <PriorityBadge priority={rec.priority} />
              {field && <Badge>{field.name}</Badge>}
            </div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{rec.title}</h1>
          </header>

          <Section title="What is happening?">{rec.situation}</Section>
          <Section title="Why does it matter?">{rec.whyItMatters}</Section>

          <section>
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink-subtle">Data behind this suggestion</h2>
            <EvidenceList evidence={rec.evidence} />
          </section>

          {rec.impact && <Section title="Potential impact">{rec.impact}</Section>}

          <Card className="p-4 sm:p-5">
            <h2 className="text-[15px] font-semibold">Your decision</h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              You know your field best — accept the suggestion, ignore it, or check the field first.
            </p>
            {rec.effect && (
              <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-[13px]">
                <span className="text-ink-muted">If you accept, {field?.name ?? "the"} irrigation will be updated: </span>
                <span className="font-medium">{rec.effect.summary}</span>
                <span className="text-ink-muted">. You can undo this at any time.</span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <DecisionControls rec={rec} size="md" />
              {(rec.domain === "water" || rec.domain === "energy") && (
                <Link to={`/farmer/intelligence/${rec.domain}`} className="text-[13px] font-medium text-brand-700 hover:underline">
                  Open irrigation schedule
                </Link>
              )}
              {rec.domain === "crop" && (
                <ButtonLink
                  to={`/farmer/experts?category=crop&field=${rec.fieldId ?? ""}`}
                  variant="secondary"
                  size="md"
                  icon={<GraduationCap aria-hidden className="size-4" />}
                >
                  Ask a crop specialist
                </ButtonLink>
              )}
            </div>
          </Card>
          <InfoNote>
            Suggestions come from rule-based analysis of demo and simulated data in this prototype. They are decision support,
            not instructions.
          </InfoNote>
        </article>

        <aside className="space-y-4">
          <HowItWorks domain={rec.domain} />
        </aside>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-ink-subtle">{title}</h2>
      <p className="text-[15px] leading-relaxed text-ink">{children}</p>
    </section>
  );
}
