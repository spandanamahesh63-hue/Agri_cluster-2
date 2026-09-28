import { useNavigate } from "react-router-dom";
import { ExternalLink, GraduationCap, HardHat, Landmark, Tractor, Wifi } from "lucide-react";
import { StepLayout } from "../../../features/plan/StepLayout";
import { usePlan } from "../../../features/plan/usePlan";
import { useLabourProfiles, useMachinery } from "../../../features/shared/useMerged";
import { experts, expertCategoryLabels } from "../../../data/mock/experts";
import { technologies } from "../../../data/mock/technology";
import { kindLabels } from "../../../features/resources/labels";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Badge, InfoNote } from "../../../components/ui/Badge";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";
import type { LabourSkill, ResourceKind } from "../../../types";

/** Step 8 — the people, equipment, technology and support this plan needs (spec §11–§13, §18). */
export function ResourcesStep() {
  const p = usePlan();
  const navigate = useNavigate();
  const toast = useToast();
  const machinery = useMachinery();
  const crews = useLabourProfiles();
  if (!p.needs) return <StepLayout step="resources">{null}</StepLayout>;
  const needs = p.needs;

  const matchedExperts = experts.filter((e) => needs.expertCategories.includes(e.category));
  const matchedTech = technologies.filter((t) => needs.technologyIds.includes(t.id));
  // Crews whose skills cover the plan's labour tasks.
  const skillForTask: Record<string, LabourSkill> = {
    "Land preparation": "land-preparation",
    Planting: "transplanting",
    Spraying: "spraying",
    Weeding: "weeding",
    Harvesting: "harvesting",
    "Sorting & packing": "grading-packing",
  };
  const crewSkills = new Set(needs.labourTasks.map((t) => skillForTask[t]).filter(Boolean));
  const matchedCrews = crews.filter((c) => c.availability !== "booked" && c.skills.some((s) => crewSkills.has(s)));

  const finish = () => {
    p.markReviewed("resources");
    toast("Your season plan is ready.");
    navigate("/farmer/plan");
  };

  return (
    <StepLayout
      step="resources"
      description="Matched to your crop, method and answers. You don't have to search for each one."
      action={<Button onClick={finish}>Finish planning</Button>}
    >
      <Card>
        <CardHeader title="Equipment to rent" subtitle="Shared through the cluster" />
        <ul className="divide-y divide-line">
          {needs.machinery.map((kind) => {
            const offers = machinery.filter((m) => m.kind === kind && m.status !== "maintenance");
            return (
              <li key={kind} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
                <span className="flex items-center gap-2">
                  <Tractor aria-hidden className="size-4 text-resource" />
                  <span className="font-medium">{kindLabels[kind as ResourceKind] ?? kind}</span>
                  <span className="text-ink-muted">· {offers.length} available in the cluster</span>
                </span>
                <ButtonLink to={`/farmer/resources?tab=machinery&kind=${kind}`} size="sm" variant="secondary">
                  See {kindLabels[kind as ResourceKind]?.toLowerCase() ?? kind}s
                </ButtonLink>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Labour you'll need" subtitle={needs.labourTasks.join(" · ")} />
        <ul className="divide-y divide-line">
          {matchedCrews.slice(0, 3).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]">
              <span className="flex items-center gap-2">
                <HardHat aria-hidden className="size-4 text-resource" />
                <span className="font-medium">{c.label}</span>
                <span className="text-ink-muted">· {c.crewSize} workers · ₹{c.dailyWage}/day</span>
              </span>
              <Badge tone={c.availability === "available" ? "success" : "warning"}>{c.availability === "available" ? "Available" : "Limited"}</Badge>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-5 py-3">
          <ButtonLink to="/farmer/resources?tab=labour" size="sm" variant="secondary">
            Request labour
          </ButtonLink>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Experts for your plan" />
          <ul className="divide-y divide-line">
            {matchedExperts.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 px-5 py-2.5 text-[13px]">
                <span className="flex items-center gap-2">
                  <GraduationCap aria-hidden className="size-4 text-crop" />
                  <span>
                    <span className="font-medium">{e.name}</span>
                    <span className="block text-[12px] text-ink-muted">{expertCategoryLabels[e.category]}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3">
            <ButtonLink to="/farmer/experts" size="sm" variant="secondary">
              Contact an expert
            </ButtonLink>
          </div>
        </Card>

        <Card>
          <CardHeader title="Technology" subtitle="Shared or rented, sized for small farms" />
          <ul className="divide-y divide-line">
            {matchedTech.map((t) => (
              <li key={t.id} className="px-5 py-2.5 text-[13px]">
                <div className="flex items-center gap-2 font-medium">
                  <Wifi aria-hidden className="size-4 text-resource" />
                  {t.name}
                </div>
                <div className="text-[12px] text-ink-muted">{t.indicativeCost}</div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3">
            <ButtonLink to="/farmer/resources?tab=technology" size="sm" variant="secondary">
              Request technology
            </ButtonLink>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Support that may apply" subtitle="Shown because of your plan and answers" />
        <ul className="divide-y divide-line">
          {p.support.map((s) => (
            <li key={s.id} className="px-5 py-3 text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <Landmark aria-hidden className="size-4 text-ink-subtle" />
                <span className="font-medium">{s.name}</span>
                <Badge>{s.category}</Badge>
                {!s.verified && <Badge tone="warning">Not verified</Badge>}
              </div>
              <p className="mt-1 text-ink-muted">{s.summary}</p>
              <p className="mt-1">
                <span className="text-ink-subtle">Why you're seeing this: </span>
                {s.relevantWhen}
              </p>
              <p className="mt-1 text-ink-muted">
                <span className="text-ink-subtle">How to apply: </span>
                {s.howToApply}
              </p>
              {s.documents.length > 0 && <p className="mt-1 text-ink-muted"><span className="text-ink-subtle">Usually needed: </span>{s.documents.join(", ")}</p>}
              <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-subtle">
                <ExternalLink aria-hidden className="size-3" />
                Source: {s.source.label}
              </p>
            </li>
          ))}
        </ul>
        <InfoNote className="border-t border-line px-5 py-3">
          Eligibility is not checked by AgriCluster. Confirm details, documents and deadlines with the official office before applying.
        </InfoNote>
      </Card>
    </StepLayout>
  );
}
