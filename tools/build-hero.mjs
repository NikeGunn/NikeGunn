// Builds assets/verify-{dark,light}.svg: a bio that fact-checks itself.
// A fluent draft types out, a verifier strikes every unsupported claim,
// and a cited rewrite remains. Run: node tools/build-hero.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const FONT_SIZE = 15;
const CHAR = 9; // every line is forced to CHAR px per glyph via textLength
const LINE = 25;
const PAD_X = 28;
const TOP = 62;

const THEMES = {
  dark: {
    ground: "#0F1B2D",
    frame: "#24364F",
    ink: "#D6DEE8",
    muted: "#7D8FA8",
    reject: "#F0697A",
    verify: "#7FB2FF",
    cite: "#EBB654",
  },
  light: {
    ground: "#FBFCFE",
    frame: "#D5DDE8",
    ink: "#13233A",
    muted: "#5E6E85",
    reject: "#B3122E",
    verify: "#1F4FBF",
    cite: "#8A5A00",
  },
};

const DRAFT =
  "Nikhil Bhagat is a world-class 10x AI genius whose models never hallucinate.";
const CLAIMS = ["world-class", "10x AI genius", "never hallucinate"];

/** Lines in order: start time (s), typing duration (s), and coloured runs. */
const LINES = [
  { at: 0.3, dur: 0.6, runs: [["muted", "$ nikhil --describe"]] },
  { at: 1.0, dur: 2.2, runs: [["ink", DRAFT]] },
  { at: 3.5, dur: 0.7, runs: [["muted", "$ verify --against ./evidence"]] },
  {
    at: 4.4,
    dur: 0.5,
    runs: [["reject", "  ✗ world-class          "], ["muted", "no evidence found"]],
  },
  {
    at: 4.9,
    dur: 0.5,
    runs: [["reject", "  ✗ 10x AI genius        "], ["muted", "no evidence found"]],
  },
  {
    at: 5.4,
    dur: 0.6,
    runs: [
      ["reject", "  ✗ never hallucinate    "],
      ["muted", "unfalsifiable, so abstain"],
    ],
  },
  { at: 6.3, dur: 0.5, runs: [["muted", "$ rewrite --cite"]] },
  {
    at: 6.9,
    dur: 2.0,
    runs: [
      [
        "ink",
        "Nikhil Bhagat builds AI systems that have to be right, not just fluent.",
      ],
    ],
  },
  {
    at: 9.0,
    dur: 1.3,
    runs: [
      ["verify", "  ✓ "],
      ["ink", "NLP research "],
      ["cite", "[1]"],
      ["verify", "   ✓ "],
      ["ink", "agents in production "],
      ["cite", "[2]"],
      ["verify", "   ✓ "],
      ["ink", "open source "],
      ["cite", "[3]"],
    ],
  },
  { at: 10.5, dur: 0.3, runs: [["muted", "exit 0"]] },
];

const escapeXml = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const lineText = (line) => line.runs.map(([, text]) => text).join("");
const longest = Math.max(...LINES.map((line) => lineText(line).length));
const WIDTH = PAD_X * 2 + longest * CHAR;
const HEIGHT = TOP + LINES.length * LINE + 22;

// One strike per rejected claim, timed with its verdict row (lines 3-5).
const strikes = CLAIMS.map((claim, index) => {
  const start = DRAFT.indexOf(claim);
  if (start < 0) throw new Error(`claim not in draft: ${claim}`);
  return {
    x: PAD_X + start * CHAR,
    width: claim.length * CHAR,
    at: LINES[3 + index].at,
  };
});

const build = (name) => {
  const t = THEMES[name];
  const rows = LINES.map((line, index) => {
    const text = lineText(line);
    const y = TOP + index * LINE;
    const spans = line.runs
      .map(([tone, run]) => `<tspan fill="${t[tone]}">${escapeXml(run)}</tspan>`)
      .join("");
    return `<text class="l" x="${PAD_X}" y="${y}" textLength="${text.length * CHAR}" lengthAdjust="spacingAndGlyphs" style="animation-delay:${line.at}s;animation-duration:${line.dur}s;animation-timing-function:steps(${text.length + 1},jump-none)">${spans}</text>`;
  }).join("\n  ");
  const draftY = TOP + LINE - 5;
  const strikeLines = strikes
    .map(
      (s) =>
        `<line class="s" x1="${s.x}" y1="${draftY}" x2="${s.x + s.width}" y2="${draftY}" stroke="${t.reject}" stroke-width="2" pathLength="1" style="animation-delay:${s.at}s"/>`,
    )
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">Nikhil Bhagat builds AI systems that have to be right, not just fluent.</title>
  <desc id="desc">A terminal session. A hype biography is typed out: Nikhil Bhagat is a world-class 10x AI genius whose models never hallucinate. A verifier strikes out world-class and 10x AI genius for lack of evidence, and never hallucinate as unfalsifiable. The rewrite keeps one cited sentence: Nikhil Bhagat builds AI systems that have to be right, not just fluent, citing NLP research, agents in production and open source.</desc>
  <style>
    text { font-family: "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "DejaVu Sans Mono", monospace; font-size: ${FONT_SIZE}px; white-space: pre; }
    .l { clip-path: inset(0 100% 0 0); animation-name: type; animation-fill-mode: forwards; }
    .s { stroke-dasharray: 1; stroke-dashoffset: 1; animation: strike 0.35s ease-out forwards; }
    @keyframes type { to { clip-path: inset(0 0 0 0); } }
    @keyframes strike { to { stroke-dashoffset: 0; } }
    @media (prefers-reduced-motion: reduce) {
      .l { clip-path: none; animation: none; }
      .s { stroke-dashoffset: 0; animation: none; }
    }
  </style>
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="10" fill="${t.ground}" stroke="${t.frame}"/>
  <text x="${PAD_X}" y="30" fill="${t.muted}" font-size="12" style="font-size:12px">verify.log</text>
  <line x1="0" y1="42" x2="${WIDTH}" y2="42" stroke="${t.frame}"/>
  ${rows}
  ${strikeLines}
</svg>
`;
};

mkdirSync(new URL("../assets/", import.meta.url), { recursive: true });
for (const name of Object.keys(THEMES))
  writeFileSync(new URL(`../assets/verify-${name}.svg`, import.meta.url), build(name));
console.log(`built ${WIDTH}x${HEIGHT}, ${longest} columns`);
