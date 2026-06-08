import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { LabItem } from "@/lib/content";
import { pad2 } from "@/lib/format";

type LabCardProps = {
  item: LabItem;
  /** 1-based position on the /lab grid. */
  index: number;
  total: number;
  tryLabel: string;
};

export function LabCard({ item, index, total, tryLabel }: LabCardProps) {
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
          {/* Same index line as ProjectCard. */}
          <p data-lab-index className="font-mono uppercase tracking-[0.12em] text-[11px] text-muted">
            {pad2(index)} / {pad2(total)}
          </p>
          <h3 className="font-display text-2xl break-words">{title}</h3>
          <p className="font-mono text-muted">{description}</p>
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
