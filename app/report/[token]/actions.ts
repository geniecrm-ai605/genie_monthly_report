"use server";

import { saveReport } from "@/lib/reports";
import type { SavePayload } from "@/lib/fields";

export async function saveReportAction(
  token: string,
  payload: SavePayload,
  submit: boolean
) {
  return saveReport(token, payload, submit);
}