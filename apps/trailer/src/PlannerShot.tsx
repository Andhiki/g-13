import { appear, cursorMove, ink, muted, orange, tween } from "./motion";
import { algorithms, analysis, CourseCard, Pointer, programming, Tag } from "./UI";
import { useTime, Stage } from "./stage";

function PlannerQuizPreview({
  t,
  chosen,
  roadmap,
}: {
  t: number;
  chosen: number;
  roadmap: number;
}) {
  const options = [
    "Analisis Data",
    "Infrastruktur Komputasi",
    "Kecerdasan Artifisial",
    "Komputasi Cerdas",
    "Rekayasa Perangkat Lunak",
    "Wirausaha Digital",
  ];
  return (
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
  );
}

function PlannerRoadmapPreview({ t, roadmap }: { t: number; roadmap: number }) {
  return (
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
  );
}

export function PlannerShot() {
  const t = useTime();
  const chosen = tween(t, 1.5, 1.8);
  const roadmap = tween(t, 3.2, 3.95);
  return (
    <Stage seconds={6.5}>
      <PlannerQuizPreview t={t} chosen={chosen} roadmap={roadmap} />
      <PlannerRoadmapPreview t={t} roadmap={roadmap} />
    </Stage>
  );
}
