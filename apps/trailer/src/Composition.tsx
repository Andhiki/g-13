import { Audio } from "@remotion/media";
import type { ReactNode } from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { appear, cursorMove, ink, muted, orange, tween, violet } from "./motion";
import { algorithms, analysis, CourseCard, Icon, Pointer, programming, Surface, Tag } from "./UI";

function useTime() {
  return useCurrentFrame() / useVideoConfig().fps;
}

function Stage({ children, seconds }: { children: ReactNode; seconds: number }) {
  const time = useTime();
  return (
    <AbsoluteFill style={{ opacity: appear(time, 0, seconds), background: "#fafbf8" }}>
      {children}
    </AbsoluteFill>
  );
}

function SearchShot() {
  const t = useTime();
  const query = "Algoritma".slice(0, Math.floor(Math.max(0, Math.min(9, (t - 3.8) / 0.15))));
  const open = tween(t, 4.65, 5.05);
  const select = tween(t, 6.75, 7.05);
  const results = [
    algorithms,
    { code: "PACS262205", title: "Praktikum Algoritma dan Struktur Data", credits: 1 },
    analysis,
  ];
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
        <div style={{ height: 1, background: "#e8e9e3", margin: "20px 0" }} />
        <h3 style={{ fontSize: 28, fontWeight: 550 }}>Silabus</h3>
        {[
          "Linked List",
          "Stack dan Queue",
          "Tree dan Graf",
          "Shortest Path Algorithms",
          "Minimum Spanning Tree",
          "Disjoint Set and Union Find",
        ].map((text, i) => (
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

function PlannerShot() {
  const t = useTime();
  const chosen = tween(t, 1.5, 1.8);
  const roadmap = tween(t, 3.2, 3.95);
  const options = [
    "Analisis Data",
    "Infrastruktur Komputasi",
    "Kecerdasan Artifisial",
    "Komputasi Cerdas",
    "Rekayasa Perangkat Lunak",
    "Wirausaha Digital",
  ];
  return (
    <Stage seconds={6.5}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - roadmap,
          translate: `0 ${roadmap * -100}px`,
          scale: 1 - roadmap * 0.1,
        }}
      >
        <div style={{ position: "absolute", left: 420, top: 230 }}>
          <h1 style={{ fontSize: 64, fontWeight: 550, letterSpacing: -2.5, margin: 0 }}>
            Peminatan mana yang kamu pilih?
          </h1>
        </div>
        <div
          style={{
            position: "absolute",
            left: 420,
            top: 375,
            width: 1080,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
          }}
        >
          {options.map((label, i) => (
            <div
              key={label}
              style={{
                position: "relative",
                padding: "44px 24px",
                textAlign: "center",
                fontSize: 27,
                border: `1.5px solid ${i === 0 && chosen ? orange : "#e1e3dc"}`,
                borderRadius: 15,
                background: i === 0 && chosen ? "#fff1e6" : "white",
                opacity: tween(t, 0.1 + i * 0.06, 0.6 + i * 0.06),
                translate: `0 ${tween(t, 0.1 + i * 0.06, 0.7 + i * 0.06, 25, 0)}px`,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: 12,
                  color: muted,
                  fontSize: 17,
                  border: "1px solid #e1e3dc",
                  borderRadius: 5,
                  padding: "1px 6px",
                }}
              >
                {i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 1270,
            top: 855,
            padding: "15px 24px",
            background: chosen ? ink : "#eff0ea",
            color: chosen ? "white" : "#a0a29b",
            borderRadius: 12,
            fontSize: 25,
          }}
        >
          Lanjut　↵
        </div>
        <Pointer
          {...(t < 2.1
            ? cursorMove(t, 0.8, 1.5, [1250, 800], [690, 435])
            : cursorMove(t, 2.1, 2.8, [690, 435], [1350, 885], -60))}
          opacity={appear(t, 0.7, 3.3)}
          time={t}
          clicks={[1.55, 2.9]}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: roadmap,
          scale: tween(t, 3.3, 4.3, 0.9, 1),
          translate: `0 ${tween(t, 3.2, 4.2, 80, 0)}px`,
        }}
      >
        <h1
          style={{
            position: "absolute",
            left: 0,
            bottom: 85,
            width: "100%",
            textAlign: "center",
            fontSize: 44,
            fontWeight: 550,
            letterSpacing: -1.5,
          }}
        >
          Rencana kuliahmu, tervisualisasi.
        </h1>
        <div style={{ position: "absolute", left: 160, top: 265, display: "flex", gap: 15 }}>
          <Tag selected>2026</Tag>
          <Tag>Analisis Data</Tag>
          <Tag>8 semester</Tag>
        </div>
        <svg width="1920" height="1080" style={{ position: "absolute" }}>
          <path
            d="M580 607H750 M1170 607H1340"
            stroke={orange}
            strokeWidth="3"
            fill="none"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - tween(t, 4.2, 5.1)}
          />
        </svg>
        {[programming, algorithms, analysis].map((course, i) => (
          <div
            key={course.code}
            style={{
              opacity: tween(t, 3.6 + i * 0.22, 4.2 + i * 0.22),
              translate: `0 ${tween(t, 3.6 + i * 0.22, 4.4 + i * 0.22, 55, 0)}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 160 + i * 590,
                top: 420,
                color: muted,
                fontSize: 27,
              }}
            >
              Semester {i + 1}
            </div>
            <CourseCard
              course={course}
              state={i === 1 ? "selected" : "neutral"}
              style={{ left: 160 + i * 590, top: 500 }}
            />
          </div>
        ))}
      </div>
    </Stage>
  );
}

function ArchiveShot() {
  const t = useTime();
  const inside = tween(t, 1.75, 2.15);
  const rows =
    inside > 0.5
      ? ["Basis Data - UTS - 2023 - KOMA.pdf", "UAS - BASDAT - 2023 - KOMB.pdf"]
      : ["2023", "2014"];
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
        {rows.map((label, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "32px 34px",
              borderTop: "1px solid #edeee8",
              background: i === 0 && t > 1 && t < 1.85 ? "#fff0e4" : "white",
              fontSize: 28,
              opacity: tween(
                t,
                inside > 0.5 ? 1.95 + i * 0.12 : 0.2,
                inside > 0.5 ? 2.3 + i * 0.12 : 0.65,
              ),
              translate: `0 ${inside > 0.5 ? tween(t, 1.95 + i * 0.12, 2.4 + i * 0.12, 18, 0) : 0}px`,
            }}
          >
            <span style={{ color: muted }}>
              <Icon kind={inside > 0.5 ? "file" : "folder"} size={31} />
            </span>
            {label}
            <div
              style={{ marginLeft: "auto", display: "flex", gap: 55, fontSize: 21, color: muted }}
            >
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 7,
                  background: inside > 0.5 ? (i === 0 ? "#e7efff" : "#fff0df") : "transparent",
                  color: inside > 0.5 ? (i === 0 ? "#4971a9" : "#a56b36") : muted,
                }}
              >
                {inside > 0.5 ? (i === 0 ? "UTS" : "UAS") : "—"}
              </span>
            </div>
          </div>
        ))}
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
