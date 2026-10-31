import { permanentRedirect } from "next/navigation";

export function GET() {
  permanentRedirect("/cv.pdf");
}
