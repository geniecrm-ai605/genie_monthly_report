import { dv } from "@/lib/dataverse";
import { F, RATINGS, STATUS, TEXT_MAX, type SavePayload } from "@/lib/fields";

import { prevMonthStart, isCurrentMonth } from "@/lib/format";

const esc = (s: string) => s.replace(/'/g, "''");
const FORMATTED = {
  Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
};
const PERSON = "$select=genie_employeenumber,genie_firstname,genie_lastname";

export async function getReportByToken(token: string) {
  if (!/^[0-9a-f]{64}$/i.test(token)) return null;
  const r = await dv(
    `${F.entitySet}?$filter=${F.token} eq '${esc(token)}'` +
      `&$expand=${F.employeeNav}(${PERSON}),${F.managerNav}(${PERSON})&$top=1`,
    { headers: FORMATTED }
  );
  return r.value?.[0] ?? null;
}

// Usi employee ki purani reports (token se mila hua employee, URL se nahi)

export async function getHistory(employeeId: string, beforeMonth: string) {
  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) return [];
  const r = await dv(
    `${F.entitySet}?$filter=${F.employeeLookup} eq ${employeeId}` +
      ` and ${F.month} lt ${beforeMonth}` +
      `&$expand=${F.managerNav}(${PERSON})` +
      `&$orderby=${F.month} desc`,
    { headers: FORMATTED }
  );
  return r.value as any[];
}



// Sirf current se pehle wala ek mahina. Isse purana data is query se aa hi nahi sakta.
export async function getPreviousReport(employeeId: string, currentMonthIso: string) {
  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) return null;
  const cur = currentMonthIso.slice(0, 10) + "T00:00:00Z";
  const prev = prevMonthStart(currentMonthIso);
  const r = await dv(
    `${F.entitySet}?$filter=${F.employeeLookup} eq ${employeeId}` +
      ` and ${F.month} ge ${prev} and ${F.month} lt ${cur}` +
      `&$expand=${F.managerNav}(${PERSON})&$top=1`,
    { headers: FORMATTED }
  );
  return r.value?.[0] ?? null;
}


// Practice ke options Dataverse se (naye choices add hon to code nahi badalna)
export async function getPracticeOptions(): Promise<{ value: number; label: string }[]> {
  try {
    const r = await dv(
      `EntityDefinitions(LogicalName='${F.logicalName}')` +
        `/Attributes(LogicalName='${F.practice}')` +
        `/Microsoft.Dynamics.CRM.PicklistAttributeMetadata` +
        `?$select=LogicalName&$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)`
    );
    const opts: any[] = r.OptionSet?.Options ?? r.GlobalOptionSet?.Options ?? [];
    return opts.map((o) => ({
      value: o.Value as number,
      label: (o.Label?.UserLocalizedLabel?.Label as string) ?? String(o.Value),
    }));
  } catch (e) {
    console.error("Practice options failed", e);
    return [];
  }
}

const isDate = (s: string | null) => s === null || /^\d{4}-\d{2}-\d{2}$/.test(s);

function validate(p: SavePayload, submit: boolean): string | null {
  if (!isDate(p.meetingDate) || !isDate(p.nextMeetingDate)) return "Invalid date.";
  for (const t of [p.outstanding, p.actionItems, p.comments])
    if (t.length > TEXT_MAX) return `Text fields can have at most ${TEXT_MAX} characters.`;
  for (const r of RATINGS) {
    const v = p.ratings[r.key];
    if (v != null && (!Number.isInteger(v) || v < 1 || v > 10)) return "Invalid rating.";
    if (submit && v == null) return `Please rate: ${r.label}`;
  }
  if (submit) {
    if (!p.meetingDate) return "Meeting date is required.";
    if (p.practice == null) return "Please select a practice.";
  }
  if (p.meetingDate && p.nextMeetingDate && p.nextMeetingDate < p.meetingDate)
    return "Next meeting date cannot be before the meeting date.";
  return null;
}

export async function saveReport(
  token: string,
  p: SavePayload,
  submit: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const report = await getReportByToken(token);
    if (!report) return { ok: false, error: "Invalid link." };

    if (!isCurrentMonth(report[F.month]))
      return { ok: false, error: "This report can no longer be edited." };

    if (report[F.status] === STATUS.SUBMITTED)
      return { ok: false, error: "This report is already submitted." };

    const err = validate(p, submit);
    if (err) return { ok: false, error: err };

    const body: Record<string, unknown> = {
      [F.meetingDate]: p.meetingDate,
      [F.nextMeetingDate]: p.nextMeetingDate,
      [F.practice]: p.practice,
      [F.outstanding]: p.outstanding.trim() || null,
      [F.actionItems]: p.actionItems.trim() || null,
      [F.comments]: p.comments.trim() || null,
    };
    for (const r of RATINGS) body[r.key] = p.ratings[r.key] ?? null;
    if (submit) body[F.status] = STATUS.SUBMITTED;

    // record ID token se aayi hai, client se nahi
    await dv(`${F.entitySet}(${report[F.id]})`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return { ok: true };
  } catch (e) {
    console.error("saveReport failed", e);
    return { ok: false, error: "Could not save. Please try again." };
  }
}