export function StatusIllustration({ kind }: { kind: "notFound" | "error" }) {
  const broken = kind === "error";
  return (
    <svg
      viewBox="0 0 480 280"
      fill="none"
      aria-hidden="true"
      className="mb-8 w-full max-w-[480px] overflow-visible"
    >
      <rect x="38" y="22" width="404" height="236" rx="24" className="fill-bg-weak-50" />
      <g
        className="stroke-stroke-soft-200"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M38 86h64V54h72v64h-40v52H70v56h64v32M38 138h32V86M102 22v32M174 22v32h64v44h-32v72h-32v56h64v32M134 118v-32M102 170v32M238 22v32h68v64h-36v52h68v56h-68v32M306 54h64v64h72M370 22v32M402 54v32h40M338 118v52M402 118v84h40M370 170v56h32v32M238 138v64h32M174 202h-40" />
      </g>
      <path
        d={broken ? "M70 226v-24h64v-64h40v-52h64v32" : "M70 226v-24h64v-64h40v-52h64v52h68v64h32"}
        className="stroke-primary-base"
        strokeWidth="2"
        strokeDasharray="3 7"
        strokeLinecap="round"
      />
      <circle cx="70" cy="226" r="5" className="fill-primary-base" />
      <g transform={broken ? "translate(218 139) rotate(-8)" : "translate(316 181) rotate(8)"}>
        <ellipse cx="24" cy="54" rx="30" ry="5" className="fill-stroke-soft-200" />
        <path
          d="M11 41 7 53M35 41l5 12"
          className="stroke-primary-base"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect width="48" height="44" rx="15" className="fill-primary-base" />
        <path
          d="M-8 25 1 30M47 27l12-9"
          className="stroke-primary-base"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <g className="fill-static-white">
          <ellipse cx="17" cy="18" rx="4" ry="5" />
          <ellipse cx="32" cy="18" rx="4" ry="5" />
        </g>
        <g className="fill-static-black">
          <circle cx="18" cy="19" r="2" />
          <circle cx="33" cy="19" r="2" />
        </g>
        <path
          d={broken ? "M21 32q4-5 8 0" : "M22 31h6"}
          className="stroke-static-white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      {broken ? (
        <g
          className="stroke-primary-base"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M238 118v8m-8 0h16v9a8 8 0 0 1-16 0zM234 147v9m8-9v9M280 178h-12m0-8v16h-9a8 8 0 0 1 0-16zM247 174h-9m9 8h-9M266 137l5-9m9 20 10-2" />
        </g>
      ) : (
        <g>
          <path
            d="M359 158q-3-10 5-13t9 5q1 5-5 8v5"
            className="stroke-primary-base"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="369" cy="170" r="1.5" className="fill-primary-base" />
        </g>
      )}
      <g transform="translate(324 30) rotate(-6 48 22)">
        <rect width="96" height="44" rx="10" className="fill-bg-white-0 stroke-stroke-soft-200" />
        <text
          x="48"
          y="29"
          textAnchor="middle"
          className="fill-text-sub-600 font-mono text-xl font-semibold"
        >
          {broken ? "oops!" : "404"}
        </text>
      </g>
    </svg>
  );
}
