import { dv } from "@/lib/dataverse";

// OData string literal me single quote escape
export const esc = (s: string) => s.replace(/'/g, "''");

export type Employee = {
  genie_employeeid: string;
  genie_employeenumber: string;
  genie_firstname: string | null;
  genie_lastname: string | null;
};

export const fullName = (e: {
  genie_firstname: string | null;
  genie_lastname: string | null;
}) => [e.genie_firstname, e.genie_lastname].filter(Boolean).join(" ");

export async function findEmployeeByNumber(number: string) {
  const r = await dv(
    `genie_employees?$select=genie_employeeid,genie_employeenumber,genie_firstname,genie_lastname,genie_password` +
      `&$filter=genie_employeenumber eq '${esc(number.trim())}'&$top=1`
  );
  return r.value?.[0] as
    | (Employee & { genie_password: string | null })
    | undefined;
}

export async function getDirectReports(managerId: string) {
  const r = await dv(
    `genie_employees?$select=genie_employeeid,genie_employeenumber,genie_firstname,genie_lastname` +
      `&$filter=_genie_reportsto_value eq ${managerId}` +
      `&$orderby=genie_firstname asc`
  );
  return r.value as Employee[];
}