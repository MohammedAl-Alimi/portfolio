import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/components";

export async function ProjectBody({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    options: { parseFrontmatter: false },
    components: mdxComponents,
  });
  return <div>{content}</div>;
}
