import { MdxBody } from "@/components/mdx/MdxBody";

export async function ProjectBody({ source }: { source: string }) {
  return <MdxBody source={source} />;
}
