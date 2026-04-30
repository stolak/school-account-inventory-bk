export function parseIntOrUndefined(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export function isStringOrNullOrUndefined(v: unknown): v is string | null | undefined {
  return v === undefined || v === null || typeof v === "string" || v === "";
}

export function isNumberOrString(v: unknown): v is number | string {
  return typeof v === "number" || typeof v === "string";
}

