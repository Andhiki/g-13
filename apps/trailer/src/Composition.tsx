import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, Sequence, staticFile, useVideoConfig } from "remotion";
import { appear, cursorMove, ink, muted, orange, tween, violet } from "./motion";
import { algorithms, analysis, CourseCard, Icon, Pointer, programming, Surface, Tag } from "./UI";
import { useTime, Stage } from "./stage";
import { PlannerShot } from "./PlannerShot";
import { ArchiveShot } from "./ArchiveShot";

function SearchShotDropdown({ open, select, t }: { open: number; select: number; t: number }) {
  const results = [
    algorithms,
    { code: "PACS262205", title: "Praktikum Algoritma dan Struktur Data", credits: 1 },
    analysis,
  ];
  return (
    <div style={{ height: open * 322, overflow: "hidden", opacity: open, padding: "0 12px" }}>
      {results.map((course, i) => (
        <div
          key={course.code}
          style={{
            marginTop: 9,
            height: 88,
            padding: "15px 20px",
            borderRadius: 14,
            background: i === 0 ? (select ? "#fff0e4" : "#f4f5f1") : "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            translate: `0 ${tween(t, 4.7 + i * 0.08, 5.1 + i * 0.08, 15, 0)}px`,
          }}
        >
          <div>
            <div style={{ fontSize: 27 }}>{course.title}</div>
            <div style={{ fontSize: 20, color: muted, marginTop: 7 }}>
              Semester {i === 2 ? 3 : 2}
            </div>
          </div>
          <span style={{ color: muted, fontSize: 21 }}>{course.code}</span>
        </div>
      ))}
    </div>
  );
}

function SearchInputBar({ query, open, t }: { query: string; open: number; t: number }) {
  return (
    <div
      style={{
        height: 112,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        gap: 22,
        borderBottom: open ? "1px solid #edeee9" : "none",
        color: query ? ink : muted,
        fontSize: 33,
      }}
    >
      <Icon kind="search" size={34} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
        {query || "Cari mata kuliah"}
        <span
          style={{
            display: query ? "inline" : "none",
            width: 2,
            flexShrink: 0,
            height: 36,
            background: ink,
            opacity: Math.floor(t * 3) % 2 ? 0 : 1,
          }}
        />
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 22,
          padding: "4px 12px",
          border: "1px solid #e2e3de",
          borderRadius: 7,
          opacity: 1 - open,
        }}
      >
        /
      </span>
    </div>
  );
}

function SearchShot() {
  const t = useTime();
  const query = "Algoritma".slice(0, Math.floor(Math.max(0, Math.min(9, (t - 3.8) / 0.15))));
  const open = tween(t, 4.65, 5.05);
  const select = tween(t, 6.75, 7.05);
  return (
    <Stage seconds={8.5}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: "100%",
          textAlign: "center",
          fontSize: 76,
          lineHeight: 1.15,
          letterSpacing: -3,
          fontWeight: 560,
          opacity: appear(t, 0.1, 3.2),
          transform: `translateY(calc(-50% + ${tween(t, 2.8, 3.3, 0, -40)}px))`,
        }}
      >
        {[
          ["Maba", "CS", "UGM,"],
          ["tapi", "bingung", "mulai", "dari", "mana?"],
        ].map((words, line) => (
          <div key={line}>
            {words.map((word, index) => {
              const start = 0.25 + (index + line * 3) * 0.22;
              return (
                <span key={word} style={{ opacity: tween(t, start, start + 0.08) }}>
                  {word}
                  {index < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 420,
          top: tween(t, 4.6, 5.1, 450, 310),
          width: 1080,
          opacity: appear(t, 3.3, 8.5),
          scale: tween(t, 3.3, 3.8, 0.96, 1),
        }}
      >
        <Surface style={{ overflow: "hidden", borderRadius: 26 }}>
          <SearchInputBar query={query} open={open} t={t} />
          <SearchShotDropdown open={open} select={select} t={t} />
        </Surface>
      </div>
      <Pointer
        {...cursorMove(t, 5.75, 6.7, [1480, 800], [920, 467])}
        opacity={appear(t, 5.6, 7.7)}
        time={t}
        clicks={[6.85]}
      />
    </Stage>
  );
}

function SemesterDots() {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        marginTop: 28,
        height: 46,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 8,
          right: 8,
          top: 5,
          height: 1,
          background: "#dedfd9",
        }}
      />
      {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
        <div
          key={semester}
          style={{
            position: "relative",
            textAlign: "center",
            color: semester === 2 ? ink : muted,
            fontSize: 18,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              margin: "0 auto 9px",
              borderRadius: "50%",
              background: semester === 2 ? orange : "white",
              border: `1.5px solid ${semester === 2 ? orange : "#d9dbd4"}`,
            }}
          />
          {semester}
        </div>
      ))}
    </div>
  );
}

function GraphShotDetailCard({ detail, t }: { detail: number; t: number }) {
  const topics = [
    "Linked List",
    "Stack dan Queue",
    "Tree dan Graf",
    "Shortest Path Algorithms",
    "Minimum Spanning Tree",
    "Disjoint Set and Union Find",
  ];
  return (
    <Surface
      style={{
        position: "absolute",
        top: 75,
        left: 90,
        width: 470,
        height: 900,
        padding: 36,
        opacity: detail,
        translate: `${(1 - detail) * -100}px 0`,
      }}
    >
      <div style={{ color: muted, fontSize: 22 }}>PACS262201</div>
      <h2
        style={{
          fontSize: 37,
          lineHeight: 1.15,
          letterSpacing: -1,
          fontWeight: 550,
          margin: "18px 0 25px",
        }}
      >
        Algoritma dan
        <br />
        Struktur Data
      </h2>
      <div style={{ display: "flex", gap: 10 }}>
        <Tag>3 SKS</Tag>
        <Tag selected>Semester 2</Tag>
      </div>
      <SemesterDots />
      <div style={{ height: 1, background: "#e8e9e3", margin: "20px 0" }} />
      <h3 style={{ fontSize: 28, fontWeight: 550 }}>Silabus</h3>
      {topics.map((text, i) => (
        <div
          key={text}
          style={{
            marginTop: 15,
            fontSize: 23,
            lineHeight: 1.3,
            color: muted,
            opacity: tween(t, 3.9 + i * 0.08, 4.3 + i * 0.08),
          }}
        >
          · {text}
        </div>
      ))}
      <h3 style={{ margin: "28px 0 12px", fontSize: 26, fontWeight: 550 }}>Referensi</h3>
      <div style={{ color: "#af693b", fontSize: 22, lineHeight: 1.4 }}>
        Introduction to Algorithms
        <br />
        <span style={{ color: muted, fontSize: 19 }}>Cormen, Leiserson, Rivest & Stein</span>
      </div>
    </Surface>
  );
}

function GraphShot() {
  const t = useTime();
  const draw = tween(t, 0.6, 2.2);
  const detail = tween(t, 3.5, 4.2);
  return (
    <Stage seconds={6.5}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: tween(t, 0, 1.2, 1.08, 1) - detail * 0.24,
          translate: `${detail * 267}px 0`,
          transformOrigin: "50% 50%",
          rotate: `${tween(t, 0, 1.1, -2, 0)}deg`,
        }}
      >
        <svg
          width="1920"
          height="1080"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <path
            d="M565 562H750"
            stroke={orange}
            strokeWidth="3"
            fill="none"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - draw}
          />
          {[-1, 1].map((direction, index) => {
            const targetY = 562 + direction * 210;
            const corner = direction * 23;
            return (
              <path
                key={direction}
                d={`M1170 562H1245Q1268 562 1268 ${562 + corner}V${targetY - corner}Q1268 ${targetY} 1291 ${targetY}H1390`}
                stroke={violet}
                strokeWidth="3"
                fill="none"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - tween(t, 1.1 + index * 0.15, 2.4 + index * 0.15)}
              />
            );
          })}
        </svg>
        <CourseCard
          course={programming}
          state="prerequisite"
          style={{
            left: 145,
            top: 455,
            opacity: tween(t, 0.4, 1),
            translate: `${tween(t, 0.4, 1.2, 40, 0)}px 0`,
          }}
        />
        <CourseCard
          course={algorithms}
          state="selected"
          style={{
            left: 750,
            top: 455,
            scale: tween(t, 0, 0.8, 0.94, 1),
            boxShadow: "0 30px 60px -35px #db9c6077",
          }}
        />
        <CourseCard
          course={analysis}
          state="dependent"
          style={{ left: 1390, top: 245, opacity: tween(t, 1, 1.6) }}
        />
        <CourseCard
          course={{ code: "PACS262307", title: "Konsep Bahasa Pemrograman", credits: 3 }}
          state="dependent"
          style={{ left: 1390, top: 665, opacity: tween(t, 1.3, 1.9) }}
        />
      </div>
      <Pointer
        {...cursorMove(t, 2.3, 3.2, [1200, 860], [960, 550], -35)}
        opacity={appear(t, 2.3, 3.9)}
        time={t}
        clicks={[3.3]}
      />
      <GraphShotDetailCard detail={detail} t={t} />
      <div
        style={{
          position: "absolute",
          bottom: 45,
          width: "100%",
          textAlign: "center",
          color: muted,
          fontSize: 30,
          opacity: tween(t, 0.5, 1),
        }}
      >
        Pahami prasyarat dan isi mata kuliahnya.
      </div>
    </Stage>
  );
}

function Ending() {
  const t = useTime();
  return (
    <Stage seconds={3}>
      <div
        style={{
          position: "absolute",
          top: 350,
          width: "100%",
          textAlign: "center",
          opacity: tween(t, 0.3, 0.8),
          translate: `0 ${tween(t, 0.3, 1, 25, 0)}px`,
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 550, letterSpacing: -3 }}>
          Semua tentang Ilkom UGM.
        </div>
        <div style={{ marginTop: 35, fontSize: 43, color: "#bc7041", fontWeight: 550 }}>
          g-13
          <span style={{ display: "inline-block", marginLeft: 20, verticalAlign: "middle" }}>
            <Icon kind="arrow" size={40} />
          </span>
        </div>
        <div style={{ marginTop: 18, fontSize: 28, color: "#555b57", fontWeight: 450 }}>
          csugm.andhiki.tech
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 650,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 65,
          opacity: tween(t, 0.65, 1.15),
          translate: `0 ${tween(t, 0.65, 1.3, 18, 0)}px`,
        }}
      >
        <Img
          src={staticFile("brand/omahti.svg")}
          alt="OmahTI"
          style={{ width: 190, height: 74, objectFit: "contain" }}
        />
        <div style={{ width: 1, height: 65, background: "#dfe1d9" }} />
        <Img
          src={staticFile("brand/himakom.png")}
          alt="HIMAKOM UGM"
          style={{ width: 90, height: 118, objectFit: "contain" }}
        />
      </div>
    </Stage>
  );
}

export function Trailer() {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: "#fafbf8",
        color: ink,
        fontFamily: "Geist, sans-serif",
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("soundtrack.wav")} />
      <Sequence name="Cari dan pilih mata kuliah" durationInFrames={8.5 * fps}>
        <SearchShot />
      </Sequence>
      <Sequence name="Kartu, prasyarat, dan silabus" from={8 * fps} durationInFrames={6.5 * fps}>
        <GraphShot />
      </Sequence>
      <Sequence name="Pilihan menjadi roadmap" from={14 * fps} durationInFrames={6.5 * fps}>
        <PlannerShot />
      </Sequence>
      <Sequence name="Folder menjadi berkas ujian" from={20 * fps} durationInFrames={5.5 * fps}>
        <ArchiveShot />
      </Sequence>
      <Sequence name="g-13" from={25 * fps} durationInFrames={3 * fps}>
        <Ending />
      </Sequence>
    </AbsoluteFill>
  );
}
