"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReportAction } from "./actions";
import { RATINGS, TEXT_MAX, type SavePayload } from "@/lib/fields";

type Option = { value: number; label: string };

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      className={`h-7 w-7 transition sm:h-8 sm:w-8 ${
        filled ? "fill-amber-400 stroke-amber-500" : "fill-transparent stroke-slate-300"
      }`}
    >
      <path
        strokeLinejoin="round"
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z"
      />
    </svg>
  );
}

function StarRating({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <div
      className="flex flex-wrap items-center gap-0.5"
      role="radiogroup"
      aria-label={label}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} out of 10`}
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(n)}
          onClick={() => onChange(value === n ? null : n)}
          className="rounded-md p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-default"
        >
          <Star filled={n <= shown} />
        </button>
      ))}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500";

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function ReportForm({
  token,
  initial,
  practiceOptions,
  locked: lockedProp,
}: {
  token: string;
  initial: SavePayload;
  practiceOptions: Option[];
  locked: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState<SavePayload>(initial);
  const [locked, setLocked] = useState(lockedProp);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const disabled = locked || pending;

  const set = <K extends keyof SavePayload>(k: K, v: SavePayload[K]) =>
    setF((p) => ({ ...p, [k]: v }));
  const setRating = (key: string, v: number | null) =>
    setF((p) => ({ ...p, ratings: { ...p.ratings, [key]: v } }));

  function check(): string | null {
    if (!f.meetingDate) return "Meeting date is required.";
    if (f.practice == null) return "Please select a practice.";
    for (const r of RATINGS)
      if (f.ratings[r.key] == null) return `Please rate: ${r.label}`;
    if (f.nextMeetingDate && f.nextMeetingDate < f.meetingDate)
      return "Next meeting date cannot be before the meeting date.";
    return null;
  }

  function run(submit: boolean) {
    setMsg(null);
    if (submit) {
      const err = check();
      if (err) return setMsg({ type: "err", text: err });
      if (!confirm("Submit this report? You will not be able to edit it afterwards."))
        return;
    }
    start(async () => {
      const res = await saveReportAction(token, f, submit);
      if (!res.ok) return setMsg({ type: "err", text: res.error });
      if (submit) {
        setLocked(true);
        setMsg({ type: "ok", text: "Report submitted successfully." });
        router.refresh();
      } else {
        setMsg({ type: "ok", text: "Draft saved." });
      }
    });
  }

  return (
    <div className="space-y-8">
      {locked && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
          This report has been submitted and is now read-only.
        </div>
      )}

      <Card title="Meeting details" description="Fields marked * are required to submit.">
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          <Field label="Meeting date" required>
            <input
              type="date"
              className={inputCls}
              disabled={disabled}
              value={f.meetingDate ?? ""}
              onChange={(e) => set("meetingDate", e.target.value || null)}
            />
          </Field>
          <Field label="Next meeting date">
            <input
              type="date"
              className={inputCls}
              disabled={disabled}
              min={f.meetingDate ?? undefined}
              value={f.nextMeetingDate ?? ""}
              onChange={(e) => set("nextMeetingDate", e.target.value || null)}
            />
          </Field>
          <Field label="Practice" required>
            <select
              className={inputCls}
              disabled={disabled}
              value={f.practice ?? ""}
              onChange={(e) =>
                set("practice", e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Select practice</option>
              {practiceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card
        title="Performance ratings"
        description="Rate each area out of 10. Tap the same star again to clear it."
      >
        <div className="grid gap-4">
          {RATINGS.map((r) => {
            const v = f.ratings[r.key] ?? null;
            return (
              <div
                key={r.key}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="text-base font-medium text-slate-800">
                    {r.label} <span className="text-red-500">*</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums ${
                      v ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {v ?? "–"}/10
                  </span>
                </div>
                <StarRating
                  label={r.label}
                  value={v}
                  onChange={(x) => setRating(r.key, x)}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Notes and follow-up">
        <div className="grid gap-5 md:grid-cols-2">
          {(
            [
              ["outstanding", "Outstanding items from previous 1:1", false],
              ["actionItems", "Action items", false],
              ["comments", "General comments / notes", true],
            ] as const
          ).map(([key, label, wide]) => (
            <div key={key} className={wide ? "md:col-span-2" : ""}>
              <Field label={label}>
                <textarea
                  rows={wide ? 6 : 7}
                  maxLength={TEXT_MAX}
                  className={`${inputCls} resize-y`}
                  disabled={disabled}
                  value={f[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
                <span className="mt-1 block text-right text-xs text-slate-400">
                  {f[key].length}/{TEXT_MAX}
                </span>
              </Field>
            </div>
          ))}
        </div>
      </Card>

      {!locked && (
        <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
          {msg && (
            <p
              className={`mb-3 px-1 text-sm font-medium ${
                msg.type === "ok" ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {msg.text}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(false)}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save draft"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(true)}
              className="flex-1 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}