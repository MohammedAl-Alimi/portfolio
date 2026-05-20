import type { ComponentType } from "react";
import { FigureSandbox } from "./FigureSandbox";

// Lab items with `kind: component` name one of these in their frontmatter.
export const labComponents: Record<string, ComponentType> = {
  FigureSandbox,
};
