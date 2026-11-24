import { appear, cursorMove, ink, muted, tween } from "./motion";
import { Icon, Pointer, Surface } from "./UI";
import { useTime, Stage } from "./stage";

function ArchiveRowItem({
  label,
  i,
  t,
  inside,
}: {
  label: string;
  i: number;
  t: number;
  inside: number;
}) {
  const showTag = inside > 0.5;
  const tagBg = showTag ? (i === 0 ? "#e7efff" : "#fff0df") : "transparent";
  const tagColor = showTag ? (i === 0 ? "#4971a9" : "#a56b36") : muted;
  const tagText = showTag ? (i === 0 ? "UTS" : "UAS") : "—";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "32px 34px",
        borderTop: "1px solid #edeee8",
        background: i === 0 && t > 1 && t < 1.85 ? "#fff0e4" : "white",
        fontSize: 28,
        opacity: tween(t, showTag ? 1.95 + i * 0.12 : 0.2, showTag ? 2.3 + i * 0.12 : 0.65),
        translate: `0 ${showTag ? tween(t, 1.95 + i * 0.12, 2.4 + i * 0.12, 18, 0) : 0}px`,
      }}
    >
      <span style={{ color: muted }}>
        <Icon kind={showTag ? "file" : "folder"} size={31} />
      </span>
      {label}
      <div style={{ marginLeft: "auto", display: "flex", gap: 55, fontSize: 21, color: muted }}>
        <span style={{ padding: "4px 10px", borderRadius: 7, background: tagBg, color: tagColor }}>
          {tagText}
        </span>
      </div>
    </div>
  );
}

function ArchiveRows({ inside, t }: { inside: number; t: number }) {
  const rows =
    inside > 0.5
      ? ["Basis Data - UTS - 2023 - KOMA.pdf", "UAS - BASDAT - 2023 - KOMB.pdf"]
      : ["2023", "2014"];
  return (
    <>
      {rows.map((label, i) => (
        <ArchiveRowItem key={label} label={label} i={i} t={t} inside={inside} />
      ))}
    </>
  );
}

function ArchiveBreadcrumb({ inside }: { inside: number }) {
  return (
    <>
      <div
        style={{
          padding: "30px 34px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 26,
          borderBottom: "1px solid #eceee7",
          color: muted,
        }}
      >
        <span>~</span>
        <Icon kind="chevron" size={22} />
        <span style={{ color: ink }}>Basis Data</span>
        <span style={{ display: "flex", alignItems: "center", gap: 18, opacity: inside }}>
          <Icon kind="chevron" size={22} />
          <span>2023</span>
        </span>
      </div>
      <div
        style={{
          padding: "16px 34px",
          background: "#f6f7f3",
          display: "flex",
          color: muted,
          fontSize: 21,
        }}
      >
        <span>Nama ↑</span>
        <span style={{ marginLeft: "auto" }}>Ujian</span>
      </div>
    </>
  );
}

export function ArchiveShot() {
  const t = useTime();
  const inside = tween(t, 1.75, 2.15);
  return (
    <Stage seconds={5.5}>
      <h1
        style={{
          position: "absolute",
          bottom: 85,
          left: 0,
          width: "100%",
          textAlign: "center",
          fontSize: 44,
          letterSpacing: -1.5,
          fontWeight: 550,
        }}
      >
        Cari ujian tahun lalu.
      </h1>
      <Surface
        style={{
          position: "absolute",
          left: 300,
          top: 335,
          width: 1320,
          overflow: "hidden",
          scale: tween(t, 0, 0.8, 0.96, 1),
          translate: `0 ${tween(t, 0, 0.8, 40, 0)}px`,
        }}
      >
        <ArchiveBreadcrumb inside={inside} />
        <ArchiveRows inside={inside} t={t} />
      </Surface>
      <Pointer
        {...cursorMove(t, 0.8, 1.55, [1280, 850], [640, 545])}
        opacity={appear(t, 0.75, 2.5)}
        time={t}
        clicks={[1.65]}
      />
    </Stage>
  );
}
