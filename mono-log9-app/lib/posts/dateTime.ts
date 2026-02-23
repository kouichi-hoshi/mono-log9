function pad2(value: number): string {
  return `${value}`.padStart(2, "0");
}

export function formatUtcDateTime(input: Date): string {
  return `${input.getUTCFullYear()}-${pad2(input.getUTCMonth() + 1)}-${pad2(input.getUTCDate())} ${pad2(input.getUTCHours())}:${pad2(input.getUTCMinutes())}`;
}
