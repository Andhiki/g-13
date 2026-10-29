import type { CSSProperties, ReactNode } from "react";
import { clickScale, ink, muted, orange, violet } from "./motion";

export function Icon({
  kind,
  size = 28,
}: {
  kind: "search" | "folder" | "file" | "chevron" | "check" | "arrow";
  size?: number;
}) {
  const paths = {
    search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    folder: "M3 6h7l2 3h9v11H3z M3 6V4h7l2 2",
    file: "M6 2h9l5 5v15H6z M14 2v6h6 M9 13h8 M9 17h6",
    chevron: "M9 5l7 7-7 7",
    check: "M5 12l5 5L20 6",
    arrow: "M4 12h16 M13 5l7 7-7 7",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[kind]} />
    </svg>
  );
}

export function Pointer({
  x,
  y,
  opacity = 1,
  rotate = 0,
  time,
  clicks,
}: {
  x: number;
  y: number;
  opacity?: number;
  rotate?: number;
  time: number;
  clicks: readonly number[];
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        scale: clickScale(time, clicks),
        rotate: `${rotate}deg`,
        transformOrigin: "4px 3px",
        zIndex: 20,
        filter: "drop-shadow(0 3px 3px #0003)",
      }}
    >
      <svg width="44" height="52" viewBox="0 0 32 38">
        <path
          d="M3 2L27 22 17 24 12 35z"
          fill={ink}
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Surface({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e6e7e3",
        borderRadius: 22,
        boxShadow: "0 18px 45px -24px #26291e33, 0 3px 8px #26291e05",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export type Course = { code: string; title: string; credits: number };
export const programming: Course = { code: "PAKF262105", title: "Pemrograman", credits: 3 };
export const algorithms: Course = {
  code: "PACS262201",
  title: "Algoritma dan Struktur Data",
  credits: 3,
};
export const analysis: Course = {
  code: "PACS262302",
  title: "Desain dan Analisis Algoritma",
  credits: 3,
};

export function CourseCard({
  course,
  state = "neutral",
  style,
}: {
  course: Course;
  state?: "neutral" | "selected" | "prerequisite" | "dependent";
  style?: CSSProperties;
}) {
  const color = state === "dependent" ? violet : state === "neutral" ? "#dddeda" : orange;
  const fill = state === "selected" ? "#fff2e8" : "#fff";
  const tab: CSSProperties = {
    padding: "9px 16px 8px",
    background: fill,
    border: `1.5px solid ${color}`,
    borderBottom: 0,
    borderRadius: "12px 12px 0 0",
    color: muted,
    fontSize: 20,
  };
  return (
    <div style={{ position: "absolute", width: 420, height: 170, ...style }}>
      <div style={{ display: "flex", height: 44 }}>
        <span style={tab}>{course.code}</span>
        <span
          style={{
            ...tab,
            marginLeft: -1.5,
            background: state === "selected" ? "#ffe7d4" : "#f5f5f2",
          }}
        >
          {course.credits} SKS
        </span>
      </div>
      <div
        style={{
          position: "relative",
          padding: "25px 24px",
          height: 126,
          display: "flex",
          alignItems: "center",
          background: fill,
          border: `1.5px solid ${color}`,
          borderRadius: "0 13px 13px 13px",
          fontSize: 29,
          lineHeight: 1.25,
          fontWeight: 520,
          letterSpacing: -0.7,
        }}
      >
        {course.title}
        {state !== "neutral" && (
          <>
            <i
              style={{
                position: "absolute",
                left: -6,
                top: "50%",
                translate: "0 -50%",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                border: "2px solid white",
              }}
            />
            <i
              style={{
                position: "absolute",
                right: -6,
                top: "50%",
                translate: "0 -50%",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                border: "2px solid white",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function Tag({ children, selected = false }: { children: ReactNode; selected?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        border: `1px solid ${selected ? "#ed965d" : "#e2e3de"}`,
        borderRadius: 12,
        padding: "11px 18px",
        color: selected ? "#a95625" : muted,
        background: selected ? "#fff1e5" : "#fff",
        fontSize: 23,
      }}
    >
      {children}
    </span>
  );
}
