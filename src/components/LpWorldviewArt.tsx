/** LP世界観イラスト（インライン。外部SVGの文字化け事故を避ける） */
export function LpWorldviewArt({ className = "h-auto w-full" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720 320"
      className={className}
      role="img"
      aria-label="鳥がヤドリギの実を運び、種を落として芽が育つ世界観のイラスト"
    >
      <rect width="720" height="320" rx="20" fill="#ebe3d6" />
      <ellipse cx="360" cy="290" rx="280" ry="28" fill="#d5e3c8" opacity="0.85" />
      <path
        d="M40 210 C120 180, 200 220, 300 195 C380 175, 450 210, 560 185 C620 170, 680 190, 700 175"
        fill="none"
        stroke="#5c4033"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M80 205 C140 175, 190 200, 250 185"
        fill="none"
        stroke="#7a5a45"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g fill="#3f6f4a">
        <ellipse cx="160" cy="168" rx="34" ry="16" transform="rotate(-18 160 168)" />
        <ellipse cx="210" cy="158" rx="30" ry="14" transform="rotate(12 210 158)" />
        <ellipse cx="250" cy="172" rx="28" ry="13" transform="rotate(-8 250 172)" />
        <ellipse cx="480" cy="155" rx="32" ry="15" transform="rotate(16 480 155)" />
        <ellipse cx="530" cy="168" rx="28" ry="13" transform="rotate(-14 530 168)" />
      </g>
      <g fill="#2f5d3a">
        <ellipse cx="185" cy="150" rx="22" ry="10" transform="rotate(-6 185 150)" />
        <ellipse cx="505" cy="148" rx="20" ry="9" transform="rotate(8 505 148)" />
      </g>
      <g fill="#c45c3e">
        <circle cx="198" cy="178" r="7" />
        <circle cx="214" cy="186" r="6.5" />
        <circle cx="228" cy="176" r="6" />
        <circle cx="512" cy="178" r="7" />
        <circle cx="528" cy="186" r="6" />
      </g>
      <g transform="translate(340 78)">
        <ellipse cx="0" cy="8" rx="28" ry="16" fill="#3f6f4a" />
        <ellipse cx="22" cy="4" rx="16" ry="11" fill="#2f5d3a" />
        <path d="M-8 0 C-36 -18, -48 8, -18 14 Z" fill="#7a9b6a" />
        <path d="M8 -2 C34 -22, 52 -4, 22 10 Z" fill="#7a9b6a" />
        <path d="M34 2 L48 -2 L38 12 Z" fill="#c45c3e" />
        <circle cx="28" cy="-2" r="2.2" fill="#f3ede3" />
        <circle cx="46" cy="-4" r="5.5" fill="#c45c3e" />
      </g>
      <g fill="#c45c3e" opacity="0.9">
        <circle cx="390" cy="150" r="4" />
        <circle cx="410" cy="178" r="3.5" />
        <circle cx="428" cy="208" r="3" />
      </g>
      <g stroke="#9e3f2a" strokeWidth="1.5" opacity="0.45" fill="none">
        <path d="M390 150 L398 162" />
        <path d="M410 178 L416 190" />
        <path d="M428 208 L432 218" />
      </g>
      <g transform="translate(445 248)">
        <circle cx="0" cy="8" r="4" fill="#c45c3e" />
        <path
          d="M0 4 C-2 -10, -12 -18, -8 -28"
          fill="none"
          stroke="#3f6f4a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse
          cx="-14"
          cy="-24"
          rx="10"
          ry="5"
          fill="#7a9b6a"
          transform="rotate(-35 -14 -24)"
        />
        <ellipse
          cx="-2"
          cy="-28"
          rx="9"
          ry="4.5"
          fill="#3f6f4a"
          transform="rotate(20 -2 -28)"
        />
      </g>
      <g transform="translate(300 255)">
        <circle cx="0" cy="6" r="3.2" fill="#c45c3e" />
        <path
          d="M0 3 C1 -8, 8 -14, 6 -22"
          fill="none"
          stroke="#3f6f4a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse
          cx="10"
          cy="-18"
          rx="8"
          ry="4"
          fill="#7a9b6a"
          transform="rotate(28 10 -18)"
        />
      </g>
    </svg>
  );
}
