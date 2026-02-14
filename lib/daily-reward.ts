const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input);
}

function getUtcDayStartMs(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getUtcDayKey(input: Date | string | number | null | undefined): string | null {
  if (input === null || input === undefined) return null;

  const date = parseDate(input);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getUtcDayDiff(from: Date, to: Date): number {
  const fromStart = getUtcDayStartMs(from);
  const toStart = getUtcDayStartMs(to);
  return Math.floor((toStart - fromStart) / MS_PER_DAY);
}

export function getNextUtcMidnight(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}
