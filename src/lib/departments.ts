export const DEPARTMENTS = [
  "SPIELWAREN",
  "SCHREIBWAREN",
  "HAUSHALT",
  "SCHULRANZEN",
  "SCHULBUECHER",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  SPIELWAREN: "Spielwaren",
  SCHREIBWAREN: "Schreibwaren",
  HAUSHALT: "Haushalt",
  SCHULRANZEN: "Schulranzen",
  SCHULBUECHER: "Schulbücher",
};
