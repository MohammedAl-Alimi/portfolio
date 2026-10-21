import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const shapes = [
  { color: "#FFD23F", left: 740, top: 50, w: 200, radius: 100 },
  { color: "#FF8A3D", left: 1000, top: 40, w: 120, radius: 60 },
  { color: "#3BCEAC", left: 980, top: 190, w: 180, radius: 44 },
  { color: "#F06595", left: 720, top: 290, w: 160, radius: 80 },
  { color: "#A78BFA", left: 940, top: 400, w: 220, radius: 56 },
  { color: "#5AA9FF", left: 740, top: 470, w: 130, radius: 32 },
];

export async function generateImageMetadata() {
  const profile = await getProfile();
  return [{ id: "default", alt: `${SITE_NAME}: ${profile.headline}`, size, contentType }];
}

export default async function OpengraphImage() {
  const profile = await getProfile();
  const [first = SITE_NAME, ...rest] = profile.name.split(" ");
  const lastName = rest.join(" ");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          flexDirection: "column",
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 640,
            height: "100%",
            padding: 72,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>{first}</div>
            <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>{lastName}</div>
            <div style={{ fontSize: 32, marginTop: 24, maxWidth: 560 }}>{profile.headline}</div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{first.toLowerCase()}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
