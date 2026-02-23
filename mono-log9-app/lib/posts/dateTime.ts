function pad2(value: number): string {
  return `${value}`.padStart(2, "0");
}

const JST_OFFSET_MINUTES = 9 * 60;

function shiftToJst(input: Date): Date {
  return new Date(input.getTime() + JST_OFFSET_MINUTES * 60 * 1000);
}

export function formatJstDateTime(input: Date): string {
  const jst = shiftToJst(input);
  return `${jst.getUTCFullYear()}-${pad2(jst.getUTCMonth() + 1)}-${pad2(jst.getUTCDate())} ${pad2(jst.getUTCHours())}:${pad2(jst.getUTCMinutes())}`;
}

export function parseDisplayJstDateTime(input: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(input);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const hours = Number.parseInt(match[4], 10);
  const minutes = Number.parseInt(match[5], 10);

  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day, hours - 9, minutes, 0, 0));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (formatJstDateTime(parsed) !== input) {
    return null;
  }

  return parsed;
}

export function parseDisplayJstDateTimeToEpochMs(input: string): number | null {
  const parsed = parseDisplayJstDateTime(input);
  if (!parsed) {
    return null;
  }
  return parsed.getTime();
}
