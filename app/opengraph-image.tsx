import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content";
import { OG_SIZE, OgFrame, ogFonts } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateImageMetadata() {
  const profile = await getProfile();
  return [{ id: "default", alt: `${SITE_NAME}: ${profile.headline}`, size, contentType }];
}

export default async function OpengraphImage() {
  const profile = await getProfile();
  const [first = SITE_NAME, ...rest] = profile.name.split(" ");
  const title = rest.length > 0 ? [first, rest.join(" ")] : [first];
  return new ImageResponse(<OgFrame title={title} subtitle={profile.headline} wordmark={first} />, {
    ...size,
    fonts: await ogFonts(),
  });
}
