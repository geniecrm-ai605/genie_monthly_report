import { F, RATINGS, STATUS } from "@/lib/fields";
import { dateLabel, monthLabel } from "@/lib/format";

const PRACTICE_LABEL = `${F.practice}@OData.Community.Display.V1.FormattedValue`;

function hasData(item: any) {
  return (
    item[F.status] === STATUS.SUBMITTED ||
    RATINGS.some((r) => item[r.key] != null) ||
    !!(item[F.outstanding] || item[F.actionItems] || item[F.comments])
  );
}

function MiniStar({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      className={`h-4 w-4 ${
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

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}

function Note({ label, value }: { label: string; value?: string | null }) {
  const empty = !value || !value.trim();
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      {empty ? (
        <p className="text-sm italic text-slate-400">Nothing recorded</p>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{value}</p>
      )}
    </div>
  );
}

export default function PreviousMonthPanel({
  item,
  prevMonthIso,
}: {
  item: any | null;
  prevMonthIso: string;
}) {
  const title = monthLabel(prevMonthIso);

  if (!item || !hasData(item)) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Previous month
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-800">{title}</h2>
        <p className="mt-3 text-sm text-slate-500">No report was filled for this month.</p>
      </section>
    );
  }

  const submitted = item[F.status] === STATUS.SUBMITTED;
  const rated = RATINGS.map((r) => item[r.key] as number | null).filter(
    (v): v is number => v != null
  );
  const avg = rated.length
    ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1)
    : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-slate-700 to-slate-600 px-5 py-4 text-white">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-300">
            Previous month · read only
          </p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            submitted ? "bg-emerald-400/90 text-emerald-950" : "bg-amber-300 text-amber-950"
          }`}
        >
          {submitted ? "Submitted" : "Draft"}
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-2">
          <Tile label="Meeting date" value={dateLabel(item[F.meetingDate])} />
          <Tile label="Next meeting" value={dateLabel(item[F.nextMeetingDate])} />
          <Tile label="Practice" value={item[PRACTICE_LABEL] ?? ""} />
          <Tile label="Average" value={avg ? `${avg} / 10` : ""} />
        </div>

        <div className="space-y-3">
          {RATINGS.map((r) => {
            const v = (item[r.key] as number | null) ?? null;
            return (
              <div key={r.key}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="text-sm text-slate-700">{r.label}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                      v != null ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {v != null ? `${v}/10` : "Not rated"}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <MiniStar key={n} filled={v != null && n <= v} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Note label="Outstanding items" value={item[F.outstanding]} />
          <Note label="Action items" value={item[F.actionItems]} />
          <Note label="General comments" value={item[F.comments]} />
        </div>
      </div>
    </section>
  );
}