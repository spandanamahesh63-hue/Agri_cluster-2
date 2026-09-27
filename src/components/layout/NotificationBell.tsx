import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Bell, CheckCheck } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { DEMO_TODAY } from "../../data/mock/clock";
import { formatDate, formatTime } from "../../utils/format";

/** Bell with unread count; the panel lists the signed-in user's notifications. */
export function NotificationBell({ compact = false }: { compact?: boolean }) {
  const { session, notifications, markRead, markAllRead } = useAppStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const mine = notifications
    .filter((n) => n.userId === session?.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const when = (iso: string) =>
    `${iso.slice(0, 10) === DEMO_TODAY ? "Today" : formatDate(iso, { weekday: "short", day: "numeric", month: "short" })}, ${formatTime(iso)}`;

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "relative grid place-items-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink",
          compact ? "size-9" : "size-8 border border-line-strong bg-surface",
        )}
      >
        <Bell aria-hidden className="size-4.5" />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4.5 text-white"
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => session && markAllRead(session.userId)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-700 hover:underline"
              >
                <CheckCheck aria-hidden className="size-3.5" />
                Mark all as read
              </button>
            )}
          </div>
          {mine.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-ink-muted">No notifications yet.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
              {mine.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                      if (n.link) navigate(n.link);
                    }}
                    className={clsx("flex w-full gap-3 px-4 py-3 text-left hover:bg-canvas", !n.read && "bg-brand-50/50")}
                  >
                    <span
                      aria-hidden
                      className={clsx("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand-500")}
                    />
                    <span className="min-w-0">
                      <span className={clsx("block text-[13px]", n.read ? "text-ink" : "font-semibold text-ink")}>
                        {n.title}
                        {!n.read && <span className="sr-only"> (unread)</span>}
                      </span>
                      {n.body && <span className="mt-0.5 block text-[12px] text-ink-muted">{n.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-ink-subtle">{when(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
