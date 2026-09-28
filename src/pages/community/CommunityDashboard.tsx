import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { EventRow, memberCount, registeredCount } from "../../features/community/EventRow";
import { StatTile } from "../../features/cluster/StatTile";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { DEMO_NOW, DEMO_TODAY } from "../../data/mock/clock";
import { formatDate, greeting } from "../../utils/format";

/** Community dashboard: groups, events, questions and updates (spec §22). */
export function CommunityDashboard() {
  const { session, groups, events, posts, replies } = useAppStore();
  const me = session!.userId;
  const myGroups = groups.filter((g) => g.organiserUserId === me);
  const upcoming = events.filter((e) => e.date >= DEMO_TODAY).sort((a, b) => a.date.localeCompare(b.date));
  const members = myGroups.reduce((s, g) => s + memberCount(g), 0);
  const registrations = upcoming.filter((e) => e.organiserUserId === me).reduce((s, e) => s + registeredCount(e), 0);
  const unanswered = posts.filter((p) => p.category === "question" && !replies.some((r) => r.postId === p.id));
  const updates = [...posts]
    .filter((p) => p.category === "announcement" || p.category === "alert" || p.category === "story")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Community organiser · Mysuru Vegetable Cluster"
        title={`${greeting(DEMO_NOW)}, ${session?.name}`}
        description="What is happening in your farming community?"
        actions={
          <ButtonLink to="/community/events?add=1" icon={<Plus aria-hidden className="size-4" />}>
            Plan an event
          </ButtonLink>
        }
      />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Groups you run" value={myGroups.length} sub={`${members} members`} to="/community/groups" />
          <StatTile label="Upcoming events" value={upcoming.length} sub={`${registrations} registrations`} to="/community/events" />
          <StatTile label="Unanswered questions" value={unanswered.length} status={unanswered.length ? "moderate" : undefined} to="/community/community" />
          <StatTile label="Success stories" value={posts.filter((p) => p.category === "story").length} to="/community/community" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Upcoming events" subtitle="Next two weeks" />
            {upcoming.length === 0 ? (
              <EmptyState title="No events planned" description="Plan a workshop, field day or meeting for your groups." />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {upcoming.slice(0, 4).map((e) => (
                  <EventRow key={e.id} event={e} compact />
                ))}
              </ul>
            )}
            <Link to="/community/events" className="block border-t border-line py-2.5 text-center text-[13px] font-medium text-brand-700 hover:bg-canvas">
              All events
            </Link>
          </Card>

          <Card>
            <CardHeader title="Questions waiting for an answer" subtitle="Point farmers to an expert or a neighbour who knows" />
            {unanswered.length === 0 ? (
              <EmptyState title="Every question has a reply" />
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {unanswered.slice(0, 4).map((p) => (
                  <li key={p.id} className="px-5 py-2.5 text-[13px]">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-ink-muted">
                      {p.authorLabel} · {formatDate(p.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/community/community" className="block border-t border-line py-2.5 text-center text-[13px] font-medium text-brand-700 hover:bg-canvas">
              Open questions
            </Link>
          </Card>

          <Card>
            <CardHeader title="Your groups" />
            <ul className="mt-2 divide-y divide-line">
              {myGroups.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13px]">
                  <span>
                    <span className="font-medium">{g.name}</span>
                    <span className="block text-ink-muted">
                      {g.village} · {g.meets}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{memberCount(g)} members</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Updates" subtitle="Announcements, alerts and success stories" />
            <ul className="mt-2 divide-y divide-line">
              {updates.map((p) => (
                <li key={p.id} className="px-5 py-2.5 text-[13px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={p.category === "alert" ? "warning" : p.category === "story" ? "success" : "brand"}>
                      {p.category === "alert" ? "Local alert" : p.category === "story" ? "Success story" : "Announcement"}
                    </Badge>
                    <span className="font-medium">{p.title}</span>
                  </div>
                  <div className="text-ink-muted">
                    {p.authorLabel} · {formatDate(p.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
