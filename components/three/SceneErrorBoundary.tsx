"use client";

import { Component, type ReactNode } from "react";
import { useSceneStore } from "@/lib/scene-store";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

let logged = false;

export class SceneErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error) {
    useSceneStore.getState().setFailed(true);
    if (!logged) {
      logged = true;
      console.error("scene error", { name: error.name });
    }
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
