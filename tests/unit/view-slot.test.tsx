import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSceneStore } from "@/lib/scene-store";

vi.mock("next/dynamic", () => ({
  default: () =>
    function Stub({ children }: { children: React.ReactNode }) {
      return <div data-testid="view">{children}</div>;
    },
}));

import { ViewSlot } from "@/components/three/ViewSlot";

beforeEach(() => {
  useSceneStore.setState({ tier: null, ready: false, failed: false });
});

describe("ViewSlot", () => {
  it("renders the poster with data-poster and no view before the tier is known", () => {
    render(
      <ViewSlot poster={<span>poster</span>}>
        <span>scene</span>
      </ViewSlot>,
    );
    const poster = screen.getByText("poster").closest("[data-poster]");
    expect(poster).toHaveClass("opacity-100", "pointer-events-none");
    expect(screen.queryByTestId("view")).toBeNull();
  });

  it("keeps the poster visible on the low tier", () => {
    useSceneStore.setState({ tier: "low", ready: true });
    render(
      <ViewSlot poster={<span>poster</span>}>
        <span>scene</span>
      </ViewSlot>,
    );
    expect(screen.getByText("poster").closest("[data-poster]")).toHaveClass("opacity-100");
    expect(screen.queryByTestId("view")).toBeNull();
  });

  it("fades the poster once the scene is active and ready", () => {
    useSceneStore.setState({ tier: "high", ready: true });
    render(
      <ViewSlot poster={<span>poster</span>}>
        <span>scene</span>
      </ViewSlot>,
    );
    expect(screen.getByText("poster").closest("[data-poster]")).toHaveClass("opacity-0");
    expect(screen.getByTestId("view")).toBeInTheDocument();
  });

  it("keeps the poster when the scene failed", () => {
    useSceneStore.setState({ tier: "high", ready: true, failed: true });
    render(
      <ViewSlot poster={<span>poster</span>}>
        <span>scene</span>
      </ViewSlot>,
    );
    expect(screen.getByText("poster").closest("[data-poster]")).toHaveClass("opacity-100");
    expect(screen.queryByTestId("view")).toBeNull();
  });
});
