import { labComponents } from "./registry";

export function ComponentSlot({ name }: { name: string }) {
  const Component = Object.hasOwn(labComponents, name) ? labComponents[name] : undefined;
  if (!Component) {
    return <p role="status">This experiment is still being built.</p>;
  }
  return <Component />;
}
