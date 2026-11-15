export const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const dateLabel = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

export const toInputDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

// Flows UTC me month set karte hain, isliye yahan bhi UTC rakha hai (dono match rahein).
export const currentMonthKey = () => new Date().toISOString().slice(0, 7);

export const isCurrentMonth = (iso: string) => iso.slice(0, 7) === currentMonthKey();

// "2026-11-01T00:00:00Z" -> "2026-10-01T00:00:00Z"
export function prevMonthStart(iso: string) {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)); // 1-12
  const d = new Date(Date.UTC(y, m - 2, 1));
  return d.toISOString().slice(0, 10) + "T00:00:00Z";
}