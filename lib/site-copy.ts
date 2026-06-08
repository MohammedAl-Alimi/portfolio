/** Fills the `{year}` placeholder in a site.json line (only the footer uses it). */
export function fillYear(line: string, year: number): string {
  return line.replaceAll("{year}", String(year));
}
