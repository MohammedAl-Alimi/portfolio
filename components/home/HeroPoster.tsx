import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  /** The hero poster is the LCP image, so it loads with priority by default. */
  priority?: boolean;
}

// Static stand-in for the hero scene. Loads with priority, it is the LCP image.
export function HeroPoster({ src, alt, priority = true }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(min-width: 1024px) 50vw, 100vw"
      // Cover, so the figure fills the slot. FigureCloud frames the cloud the same way.
      className="object-cover"
    />
  );
}
