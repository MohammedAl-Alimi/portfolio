import { labComponents } from "./registry";

export function ComponentSlot({ name, buildingText }: { name: string; buildingText: string }) {
  const Component = Object.hasOwn(labComponents, name) ? labComponents[name] : undefined;
  if (!Component) {
    return <p role="status">{buildingText}</p>;
  }
  return <Component />;
}
