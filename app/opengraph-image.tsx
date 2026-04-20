import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const shapes = [
  { color: "#FFD23F", left: 760, top: 40, w: 220, radius: 110 },
  { color: "#3BCEAC", left: 980, top: 150, w: 170, radius: 40 },
  { color: "#F06595", left: 700, top: 270, w: 150, radius: 75 },
  { color: "#A78BFA", left: 900, top: 350, w: 230, radius: 60 },
  { color: "#FF8A3D", left: 1040, top: 20, w: 110, radius: 55 },
  { color: "#5AA9FF", left: 760, top: 470, w: 120, radius: 30 },
];

export async function generateImageMetadata() {
  const profile = await getProfile();
  return [{ id: "default", alt: `${SITE_NAME}: ${profile.headline}`, size, contentType }];
}

export default async function OpengraphImage() {
  const profile = await getProfile();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#FFFBF5",
          color: "#1A1A1A",
        }}
      >
        {shapes.map((s) => (
          <div
            key={s.color}
            style={{
              position: "absolute",
              left: s.left,
              top: s.top,
              width: s.w,
              height: s.w,
              borderRadius: s.radius,
              backgroundColor: s.color,
              opacity: 0.85,
            }}
          />
        ))}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 40, marginTop: 32 }}>{profile.headline}</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>mohammed</div>
      </div>
    ),
    { ...size },
  );
}
