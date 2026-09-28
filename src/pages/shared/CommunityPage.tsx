import { useMemo, useState, type FormEvent } from "react";
import clsx from "clsx";
import { Megaphone, MessageSquare, Pin } from "lucide-react";
import type { CommunityPost, PostCategory } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { publicLabel, roleNoun } from "../../features/shared/identity";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { EventRow, GroupRow } from "../../features/community/EventRow";
import { DEMO_TODAY } from "../../data/mock/clock";
import { Badge, InfoNote, type Tone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";
import { FilterChips } from "../../components/navigation/FilterChips";
import { FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatTime } from "../../utils/format";

const categories: Record<PostCategory, { label: string; tone: Tone }> = {
  announcement: { label: "Announcement", tone: "brand" },
  alert: { label: "Local alert", tone: "warning" },
  question: { label: "Question", tone: "info" },
  practice: { label: "What worked", tone: "crop" },
  story: { label: "Success story", tone: "success" },
  resource: { label: "Resource sharing", tone: "resource" },
};

/** Agriculture-focused community for the cluster (spec §27, §68). */
export function CommunityPage() {
  const { posts, replies, session } = useAppStore();
  const [filter, setFilter] = useState<PostCategory | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const sorted = useMemo(() => [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [posts]);
  const announcements = sorted.filter((p) => p.category === "announcement");
  const feed = sorted.filter((p) => p.category !== "announcement" && (filter === "all" || p.category === filter));

  return (
    <>
      <PageHeader
        title="Community"
        description="Questions, local alerts and what's working — for the Mysuru Vegetable Cluster."
        actions={
          <a
            href="#ask"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("ask")?.scrollIntoView({ behavior: "smooth" });
              document.getElementById("ask")?.querySelector("select")?.focus({ preventScroll: true });
            }}
            className="inline-flex h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-medium text-white hover:bg-brand-800 lg:hidden"
          >
            Ask or share
          </a>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {announcements.map((p) => (
            <Card key={p.id} className="border-brand-200 bg-brand-50 p-4">
              <div className="flex items-center gap-2 text-[12px] font-medium text-brand-800">
                <Pin aria-hidden className="size-3.5" /> {p.authorRole === "community" ? `Local announcement · ${p.authorLabel}` : "Cluster announcement"} ·{" "}
                {formatDate(p.createdAt)}, {formatTime(p.createdAt)}
              </div>
              <h2 className="mt-1 text-[15px] font-semibold">{p.title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink">{p.body}</p>
            </Card>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterChips<PostCategory | "all">
              label="Topic"
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: "All" },
                ...(["question", "alert", "practice", "story", "resource"] as PostCategory[]).map((c) => ({ id: c, label: categories[c].label })),
              ]}
            />
          </div>

          {feed.length === 0 ? (
            <Card>
              <EmptyState title="No posts in this topic yet" description="Start the conversation — ask a question or share what worked." />
            </Card>
          ) : (
            feed.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                replyCount={replies.filter((r) => r.postId === p.id).length}
                open={open === p.id}
                onToggle={() => setOpen(open === p.id ? null : p.id)}
              />
            ))
          )}
        </div>

        <aside className="space-y-4">
          <Composer canAnnounce={session?.role === "cluster" || session?.role === "community"} />
          <UpcomingEvents />
          <GroupsNearYou />
          <InfoNote>Keep it about farming in the cluster. Farmers appear by farm label; experts, providers and the cluster office by name.</InfoNote>
        </aside>
      </div>
    </>
  );
}

function PostCard({ post, replyCount, open, onToggle }: { post: CommunityPost; replyCount: number; open: boolean; onToggle: () => void }) {
  const { replies } = useAppStore();
  const thread = replies.filter((r) => r.postId === post.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const cat = categories[post.category];
  return (
    <Card>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
          <Badge tone={cat.tone}>{cat.label}</Badge>
          <span className="font-medium text-ink">{post.authorLabel}</span>
          <span>· {roleNoun[post.authorRole]}</span>
          <span>
            · {formatDate(post.createdAt)}, {formatTime(post.createdAt)}
          </span>
        </div>
        <h3 className="mt-2 text-[15px] font-semibold">{post.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{post.body}</p>
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700"
        >
          <MessageSquare aria-hidden className="size-4" />
          {open ? "Hide replies" : replyCount ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "Reply"}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-canvas px-4 py-3 sm:px-5">
          {thread.length > 0 && (
            <ul className="mb-3 space-y-3">
              {thread.map((r) => (
                <li key={r.id} className={clsx("rounded-lg bg-surface p-3 text-[13px]", r.authorRole === "expert" && "border border-crop/30")}>
                  <div className="text-[12px] text-ink-muted">
                    <span className="font-medium text-ink">{r.authorLabel}</span> · {roleNoun[r.authorRole]} · {formatTime(r.createdAt)}
                  </div>
                  <p className="mt-1 leading-relaxed">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
          <ReplyBox postId={post.id} />
        </div>
      )}
    </Card>
  );
}

function ReplyBox({ postId }: { postId: string }) {
  const { session, addReply } = useAppStore();
  const toast = useToast();
  const [body, setBody] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addReply({ postId, authorUserId: session!.userId, authorLabel: publicLabel(session!.userId, session!.role), authorRole: session!.role, body: body.trim() });
    setBody("");
    toast("Reply posted.");
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="sr-only">Your reply</span>
        <TextArea rows={2} placeholder="Write a reply…" value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <Button type="submit" size="sm" disabled={!body.trim()}>
        Reply
      </Button>
    </form>
  );
}

function GroupsNearYou() {
  const { groups, session } = useAppStore();
  if (session?.role === "community") return null;
  return (
    <Card>
      <CardHeader title="Farmer groups" subtitle="Local groups you can join" />
      <ul className="mt-2 divide-y divide-line">
        {groups.slice(0, 3).map((g) => (
          <GroupRow key={g.id} group={g} />
        ))}
      </ul>
    </Card>
  );
}

function UpcomingEvents() {
  const { events } = useAppStore();
  const upcoming = [...events].filter((e) => e.date >= DEMO_TODAY).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  if (upcoming.length === 0) return null;
  return (
    <Card>
      <CardHeader title="Events near you" subtitle="Workshops, field days and meetings" />
      <ul className="mt-2 divide-y divide-line">
        {upcoming.map((e) => (
          <EventRow key={e.id} event={e} compact />
        ))}
      </ul>
    </Card>
  );
}

function Composer({ canAnnounce }: { canAnnounce: boolean }) {
  const { session, addPost } = useAppStore();
  const toast = useToast();
  const [category, setCategory] = useState<PostCategory>(canAnnounce ? "announcement" : "question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5) return setError("Add a short title so others know what it's about.");
    addPost({
      authorUserId: session!.userId,
      authorLabel: publicLabel(session!.userId, session!.role),
      authorRole: session!.role,
      category,
      title: title.trim(),
      body: body.trim(),
    });
    setTitle("");
    setBody("");
    setError(null);
    toast(category === "announcement" ? "Announcement pinned for the whole cluster." : "Posted to the cluster community.");
  };

  const options = (canAnnounce ? ["announcement"] : []).concat(["question", "alert", "practice", "story", "resource"]) as PostCategory[];
  return (
    <Card className="scroll-mt-20 p-5" id="ask">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <Megaphone aria-hidden className="size-4 text-ink-subtle" />
        Ask or share
      </h2>
      <form onSubmit={submit} noValidate className="mt-3 space-y-3">
        <FormField label="Topic">
          {(p) => (
            <SelectInput {...p} value={category} onChange={(e) => setCategory(e.target.value as PostCategory)}>
              {options.map((c) => (
                <option key={c} value={c}>
                  {categories[c].label}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Title" error={error}>
          {(p) => <TextInput {...p} value={title} onChange={(e) => (setTitle(e.target.value), setError(null))} placeholder="e.g. Yellowing on onion leaves?" />}
        </FormField>
        <FormField label="Details" hint="Optional">
          {(p) => <TextArea {...p} rows={3} value={body} onChange={(e) => setBody(e.target.value)} />}
        </FormField>
        <Button type="submit" className="w-full">
          {category === "question" ? "Ask question" : "Post"}
        </Button>
      </form>
    </Card>
  );
}
