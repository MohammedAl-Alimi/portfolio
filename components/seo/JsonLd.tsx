type JsonLdProps = {
  data: Record<string, unknown>;
  nonce?: string;
};

// The one sanctioned dangerouslySetInnerHTML in this repo. The data is a typed
// object built from our own content, and "<" is escaped so it cannot close the tag.
export function JsonLd({ data, nonce }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
