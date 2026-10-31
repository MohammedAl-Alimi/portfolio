import { compileMDX } from "next-mdx-remote/rsc";
import { createMdxComponents } from "@/components/mdx/components";

export async function MdxBody({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    options: { parseFrontmatter: false },
    components: createMdxComponents(new Map()),
  });
  return <div>{content}</div>;
}
