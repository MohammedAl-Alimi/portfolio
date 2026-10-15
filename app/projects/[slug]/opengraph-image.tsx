import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { contrastText } from "@/lib/color";
import { getProject, getProjects } from "@/lib/content";

export const alt = "Project preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.frontmatter.slug }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const { title, tagline, color } = project.frontmatter;
  const text = contrastText(color);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: color,
          color: text,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>{title}</div>
          <div style={{ fontSize: 36, marginTop: 32, maxWidth: 900 }}>{tagline}</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>mohammed</div>
      </div>
    ),
    { ...size },
  );
}
