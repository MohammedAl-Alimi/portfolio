/** Two-digit, zero-padded card index: 1 -> "01". */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
