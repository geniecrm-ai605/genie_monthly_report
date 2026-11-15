// Yahan apne Dataverse ke asli schema names (lowercase logical names) check karo.
export const F = {
  entitySet: "genie_monthlyreports",
  logicalName: "genie_monthlyreport",
  id: "genie_monthlyreportid",
  token: "genie_accesstoken",
  month: "genie_reportmonth",
  meetingDate: "genie_meetingdate",
  nextMeetingDate: "genie_nextmeetingdate",
  practice: "genie_practice",
  status: "genie_status",
  outstanding: "genie_outstandingitemsfromprevious11",
  actionItems: "genie_actionitems",
  comments: "genie_generalcomments",
  employeeNav: "genie_Employee", // lookup ka navigation property (case-sensitive)
  managerNav: "genie_LineManager",
  employeeLookup: "_genie_employee_value",
} as const;

export const RATINGS = [
  { key: "genie_qualityofwork", label: "Technical Skills / Quality of Work" },
  { key: "genie_adherencetoprocessanddiscipline", label: "Adherence to Process and Discipline" },
  { key: "genie_employeemotivation", label: "Employee Motivation" },
  { key: "genie_customersatisfaction", label: "Customer Satisfaction" },
  { key: "genie_certificationsandtrainings", label: "Self Development / Certifications and Trainings" },
  { key: "genie_communicationandcollaboration", label: "Communication and Collaboration" },
] as const;

// Status choice ki values. Submitted ka code Dataverse me check kar lo.
export const STATUS = { DRAFT: 200000000, SUBMITTED: 200000001 } as const;

export const TEXT_MAX = 2000; // multiline text ki default limit

export type SavePayload = {
  meetingDate: string | null; // yyyy-MM-dd
  nextMeetingDate: string | null;
  practice: number | null;
  ratings: Record<string, number | null>;
  outstanding: string;
  actionItems: string;
  comments: string;
};