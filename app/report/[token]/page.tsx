import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getReportByToken, getPreviousReport, getPracticeOptions } from "@/lib/reports";
import { F, RATINGS, STATUS, type SavePayload } from "@/lib/fields";
import { monthLabel, toInputDate, isCurrentMonth, prevMonthStart } from "@/lib/format";
import ReportForm from "./ReportForm";
import PreviousMonthPanel from "./PreviousMonthPanel";

export const metadata: Metadata = {
  title: "Monthly Report",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // token kisi aur site ko referrer me leak na ho
};

const fullName = (p?: { genie_firstname?: string | null; genie_lastname?: string | null } | null) =>
  p ? [p.genie_firstname, p.genie_lastname].filter(Boolean).join(" ") : "—";

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-base font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}

function Expired() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800">This link has expired</h1>
        <p className="mt-2 text-sm text-slate-500">
          Reports can only be filled for the current month. Please request a new link
          from the chat.
        </p>
      </div>
    </main>
  );
}

async function ReportView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await getReportByToken(token);
  if (!report) notFound();

  // Sirf current month. Purane mahine ka link expire.
  if (!isCurrentMonth(report[F.month])) return <Expired />;

  const [previous, practiceOptions] = await Promise.all([
    getPreviousReport(report[F.employeeLookup], report[F.month]),
    getPracticeOptions(),
  ]);

  const emp = report[F.employeeNav];
  const mgr = report[F.managerNav];
  const submitted = report[F.status] === STATUS.SUBMITTED;
  const name = fullName(emp);
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const initial: SavePayload = {
    meetingDate: toInputDate(report[F.meetingDate]) || null,
    nextMeetingDate: toInputDate(report[F.nextMeetingDate]) || null,
    practice: report[F.practice] ?? null,
    ratings: Object.fromEntries(RATINGS.map((r) => [r.key, report[r.key] ?? null])),
    outstanding: report[F.outstanding] ?? "",
    actionItems: report[F.actionItems] ?? "",
    comments: report[F.comments] ?? "",
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-6 text-white">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white/20 text-xl font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-semibold">{name}</h1>
              <p className="text-sm text-indigo-100">
                Monthly 1:1 report · {monthLabel(report[F.month])}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                submitted ? "bg-emerald-400/90 text-emerald-950" : "bg-amber-300 text-amber-950"
              }`}
            >
              {submitted ? "Submitted" : "Draft"}
            </span>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Employee name" value={name} />
            <Info label="Employee ID" value={emp?.genie_employeenumber ?? ""} />
            <Info label="Line manager" value={mgr ? fullName(mgr) : ""} />
            <Info label="Line manager emp ID" value={mgr?.genie_employeenumber ?? ""} />
          </div>
        </header>

        {/* Left 35% previous month, right 65% current month */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] lg:items-start">
          <aside className="order-2 lg:order-1 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            <PreviousMonthPanel
              item={previous}
              prevMonthIso={prevMonthStart(report[F.month])}
            />
          </aside>

          <section className="order-1 lg:order-2">
            <ReportForm
              token={token}
              initial={initial}
              practiceOptions={practiceOptions}
              locked={submitted}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

export default function Page(props: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-slate-500">Loading...</p>}>
      <ReportView params={props.params} />
    </Suspense>
  );
}