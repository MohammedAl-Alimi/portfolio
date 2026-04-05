type LabFrameProps = { url: string; title: string };

export function LabFrame({ url, title }: LabFrameProps) {
  return (
    <iframe
      src={url}
      title={title}
      sandbox="allow-scripts allow-same-origin"
      referrerPolicy="no-referrer"
      loading="lazy"
      className="w-full aspect-[16/10] rounded-[var(--radius-md)] border border-border bg-surface"
    />
  );
}
