export function sseLine(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}
