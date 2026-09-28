import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock, Play, TriangleAlert } from "lucide-react";
import { Dialog } from "../modals/Dialog";
import { Button } from "../ui/Button";

interface VideoWalkthroughProps {
  title: string;
  durationSec: number;
  summary: string;
  steps: string[];
  benefits: string[];
  considerations: string[];
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * "How it works" video (spec §9). The prototype has no video files, so the
 * player shows an illustrated step-by-step walkthrough and says so plainly.
 * Swap in a real <video> source later without changing callers.
 */
export function VideoWalkthrough({ title, durationSec, summary, steps, benefits, considerations }: VideoWalkthroughProps) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setI(0);
          setOpen(true);
        }}
        className="group relative block w-full overflow-hidden rounded-xl text-left"
        aria-label={`Play walkthrough: ${title}, ${mmss(durationSec)}`}
      >
        <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-brand-800 to-brand-600">
          <svg aria-hidden viewBox="0 0 160 90" className="absolute inset-0 size-full opacity-20">
            {[18, 34, 50, 66, 82].map((y) => (
              <path key={y} d={`M0 ${y} Q40 ${y - 6} 80 ${y} T160 ${y}`} fill="none" stroke="white" strokeWidth="1" />
            ))}
          </svg>
          <span className="relative grid size-14 place-items-center rounded-full bg-white/95 text-brand-800 shadow-pop transition-transform group-hover:scale-105">
            <Play aria-hidden className="ml-0.5 size-6" fill="currentColor" />
          </span>
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white">
            <Clock aria-hidden className="size-3" />
            {mmss(durationSec)}
          </span>
          <span className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white">Video placeholder</span>
        </div>
        <div className="mt-2">
          <div className="text-sm font-semibold text-ink">{title}</div>
          <div className="text-[12px] text-ink-muted">{summary}</div>
        </div>
      </button>

      {open && (
        <Dialog
          title={title}
          description="Illustrated walkthrough. There is no video file in this prototype."
          onClose={() => setOpen(false)}
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              <Button variant="ghost" size="sm" icon={<ChevronLeft aria-hidden className="size-4" />} disabled={i === 0} onClick={() => setI(i - 1)}>
                Previous
              </Button>
              <span className="text-[12px] text-ink-muted" aria-live="polite">
                Step {i + 1} of {steps.length}
              </span>
              {i < steps.length - 1 ? (
                <Button size="sm" onClick={() => setI(i + 1)}>
                  Next step
                  <ChevronRight aria-hidden className="size-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid aspect-video place-items-center rounded-lg bg-brand-50 p-6 text-center">
              <div>
                <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white">{i + 1}</div>
                <p className="text-[15px] font-medium leading-snug text-ink">{steps[i]}</p>
              </div>
            </div>
            <div className="flex gap-1" aria-hidden>
              {steps.map((_, j) => (
                <span key={j} className={`h-1 flex-1 rounded-full ${j <= i ? "bg-brand-600" : "bg-line"}`} />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">Benefits</div>
                <ul className="space-y-1 text-[13px]">
                  {benefits.map((b) => (
                    <li key={b} className="flex gap-1.5">
                      <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">Consider</div>
                <ul className="space-y-1 text-[13px]">
                  {considerations.map((c) => (
                    <li key={c} className="flex gap-1.5">
                      <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0 text-warning" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
