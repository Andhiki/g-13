import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { appear } from "./motion";

export function useTime() {
  return useCurrentFrame() / useVideoConfig().fps;
}

export function Stage({ children, seconds }: { children: ReactNode; seconds: number }) {
  const time = useTime();
  return (
    <AbsoluteFill style={{ opacity: appear(time, 0, seconds), background: "#fafbf8" }}>
      {children}
    </AbsoluteFill>
  );
}
