// Writes tiny.bin: an 8 point figure in the MA01 format, for the parser tests.
// Run: node tests/fixtures/figure/make-tiny.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** @type {[number, number, number, number][]} x, y, z (int8), luminance (uint8) */
export const TINY_POINTS = [
  [-127, -127, -127, 0],
  [127, -127, -127, 36],
  [-127, 127, -127, 73],
  [127, 127, -127, 109],
  [-127, -127, 127, 146],
  [127, -127, 127, 182],
  [0, 64, -64, 219],
  [1, -1, 32, 255],
];

export function makeTiny() {
  const buf = Buffer.alloc(8 + TINY_POINTS.length * 4);
  buf.write("MA01", 0, "ascii");
  buf.writeUInt32LE(TINY_POINTS.length, 4);
  TINY_POINTS.forEach(([x, y, z, l], i) => {
    const o = 8 + i * 4;
    buf.writeInt8(x, o);
    buf.writeInt8(y, o + 1);
    buf.writeInt8(z, o + 2);
    buf.writeUInt8(l, o + 3);
  });
  return buf;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL("./tiny.bin", import.meta.url), makeTiny());
}
