export function StatusIllustration({ kind }: { kind: "notFound" | "error" }) {
  const broken = kind === "error";
  return (
    <svg
      viewBox="0 0 480 300"
      fill="none"
      aria-hidden="true"
      className="mb-8 w-full max-w-[480px] overflow-visible"
    >
      <ellipse cx="244" cy="270" rx="176" ry="10" className="fill-bg-weak-50" />
      <path
        d="m42 56 124-24 132 24 124-24v202l-124 24-132-24-124 24Z"
        className="fill-bg-weak-50 stroke-stroke-soft-200"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M166 32v202l132 24V56Z" className="fill-primary-base" opacity="0.06" />
      <g
        className="stroke-stroke-soft-200"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M166 32v202M298 56v202" opacity="0.25" />
        <path d="M42 154h44V86h48M42 186h76v-64h40V70h96M86 250v-32h64v-64h40v-52h32M86 186v-32h32M150 234h72v-32M190 234v-48h32M254 70v32h32V70h44M254 102v16M254 202v32h68v-16h48M326 86v100h44v-64h52M370 186h52M394 218v22" />
      </g>
      <path
        d={
          broken
            ? "M70 226v-16q0-8 8-8h48q8 0 8-8v-48q0-8 8-8h24q8 0 8-8V94q0-8 8-8h48q8 0 8 8v24"
            : "M70 226v-16q0-8 8-8h48q8 0 8-8v-48q0-8 8-8h24q8 0 8-8V94q0-8 8-8h48q8 0 8 8v36q0 8 8 8h52q8 0 8 8v48q0 8 8 8h24"
        }
        className="stroke-primary-base"
        strokeWidth="3"
        strokeDasharray="4 8"
        strokeLinecap="round"
      />
      <circle cx="70" cy="226" r="6" className="fill-primary-base" />
      <circle cx="70" cy="226" r="12" className="stroke-primary-base" opacity="0.25" />
      <g
        transform={
          broken
            ? "translate(324 190) rotate(-8) scale(1.35)"
            : "translate(324 186) rotate(8) scale(1.35)"
        }
      >
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
            d="M377 151q-5-15 7-19t13 8q1 7-7 11v7"
            className="stroke-primary-base"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="390" cy="167" r="2" className="fill-primary-base" />
        </g>
      )}
      <g transform="translate(302 15) rotate(7 58 30)">
        <rect width="116" height="60" rx="12" className="fill-bg-white-0 stroke-stroke-soft-200" />
        <text
          x="58"
          y="40"
          textAnchor="middle"
          className="fill-text-strong-950 font-mono text-3xl font-semibold"
        >
          {broken ? "oops!" : "404"}
        </text>
      </g>
    </svg>
  );
}
