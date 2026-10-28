const RAW_TAG = /<\s*[a-zA-Z]/;

/** Finds the first raw HTML or JSX tag outside fenced code blocks. */
export function findRawTag(body: string): { line: number; text: string } | null {
  const lines = body.split(/\r?\n/);
  let fence: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const marker = /^\s*(```+|~~~+)/.exec(line);
    if (marker) {
      const kind = marker[1]?.[0] ?? "`";
      if (fence === null) fence = kind;
      else if (fence === kind) fence = null;
      continue;
    }
    if (fence !== null) continue;
    if (RAW_TAG.test(line)) return { line: i + 1, text: line.trim() };
  }
  return null;
}
