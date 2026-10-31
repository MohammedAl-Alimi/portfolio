import Image from "next/image";

export function HeroPoster() {
  return (
    <Image
      src="/posters/cluster.webp"
      alt="Colourful floating shapes"
      fill
      priority
      sizes="(min-width: 1024px) 58vw, 100vw"
      className="object-contain"
    />
  );
}
