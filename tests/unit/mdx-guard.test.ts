import { describe, expect, it } from "vitest";
import { findRawTag } from "@/lib/mdx-guard";

describe("findRawTag", () => {
  it("returns null for plain markdown", () => {
    expect(findRawTag("# Title\n\nSome text a > b and 3 <4.\n")).toBeNull();
  });
  it("finds a raw tag with its line", () => {
    expect(findRawTag('one\ntwo <iframe src="x"></iframe>\n')).toEqual({
      line: 2,
      text: 'two <iframe src="x"></iframe>',
    });
  });
  it("finds a spaced tag", () => {
    expect(findRawTag("< a href=x>")).not.toBeNull();
  });
  it("ignores tags inside fenced code blocks and keeps line numbers", () => {
    const body = "```html\n<div>ok</div>\n```\n<b>bad</b>";
    expect(findRawTag(body)).toEqual({ line: 4, text: "<b>bad</b>" });
    expect(findRawTag("```\n<div>\n```")).toBeNull();
  });
});
