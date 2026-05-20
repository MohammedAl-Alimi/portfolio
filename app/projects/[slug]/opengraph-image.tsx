import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getProfile, getProject, getProjects } from "@/lib/content";
import { OG_SIZE, OgFrame, ogFonts } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  const alt = project ? `${project.frontmatter.title}: ${project.frontmatter.tagline}` : "Project preview";
  return [{ id: "default", alt, size, contentType }];
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, profile] = await Promise.all([getProject(slug), getProfile()]);
  if (!project) notFound();
  const { title, tagline } = project.frontmatter;
  const [first = profile.name] = profile.name.split(" ");

  return new ImageResponse(<OgFrame title={[title]} subtitle={tagline} wordmark={first} />, {
    ...size,
    fonts: await ogFonts(),
  });
}
