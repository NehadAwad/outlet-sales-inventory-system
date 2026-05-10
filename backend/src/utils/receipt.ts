export function formatReceiptNumber(outletCode: string, sequence: number): string {
  return `${outletCode}-${String(sequence).padStart(6, "0")}`;
}
