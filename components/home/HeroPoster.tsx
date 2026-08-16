import Image from "next/image";

interface Props {
  src: string;
  alt: string;
}

// Static stand-in for the hero scene. Loads with priority, it is the LCP image.
export function HeroPoster({ src, alt }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      sizes="(min-width: 1024px) 50vw, 100vw"
      className="object-contain"
    />
  );
}
