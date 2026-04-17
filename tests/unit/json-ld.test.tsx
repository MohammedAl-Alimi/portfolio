import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/JsonLd";

describe("JsonLd", () => {
  it("escapes < so data cannot close the script tag", () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{ name: "</script><img src=x onerror=alert(1)>" }} nonce="abc" />,
    );
    expect(html).toContain("\\u003c/script");
    expect(html).not.toContain("</script><img");
    expect(html.match(/<\/script/g)).toHaveLength(1);
    expect(html).toContain('type="application/ld+json"');
  });
});
