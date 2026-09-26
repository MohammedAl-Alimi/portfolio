import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { LabItem } from "@/lib/content";

type LabCardProps = { item: LabItem; tryLabel: string };

export function LabCard({ item, tryLabel }: LabCardProps) {
  const { title, slug, description, thumbnail, thumbnailAlt } = item.frontmatter;

  return (
    <Card className="h-full overflow-hidden p-0">
      <div className="flex h-full flex-col">
        <Image
          src={thumbnail}
          alt={thumbnailAlt}
          width={1600}
          height={900}
          sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 100vw"
          className="aspect-video w-full object-cover"
        />
        <div className="flex flex-1 flex-col gap-3 p-6">
          <h3 className="font-display text-2xl">{title}</h3>
          <p className="text-muted">{description}</p>
          <div className="mt-auto pt-2">
            <Button href={`/lab/${slug}`} variant="secondary">
              {tryLabel}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
