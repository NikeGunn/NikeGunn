// Builds assets/verify-{dark,light}.svg: a bio that fact-checks itself.
//
// Three rhythms tell the story. Commands are typed by a human (uneven
// keystrokes, a beat before Enter). The hype bio streams like an LLM (fast
// word bursts). The verifier prints like a machine (whole lines, one verdict
// at a time). The rewrite slows down and holds before "not just fluent."
// Everything is driven by one per-character timeline and loops after a hold.
//
// Run: node tools/build-hero.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const FONT_SIZE = 15;
const CHAR = 9; // every line is forced to CHAR px per glyph via textLength
const LINE = 25;
const PAD_X = 28;
const TOP = 62;
const HOLD = 6; // seconds the finished log stays on screen before replaying

const THEMES = {
  dark: {
    ground: "#0F1B2D",
    frame: "#24364F",
    ink: "#D6DEE8",
    muted: "#7D8FA8",
    reject: "#F0697A",
    verify: "#7FB2FF",
    cite: "#EBB654",
    caret: "#D6DEE8",
  },
  light: {
    ground: "#FBFCFE",
    frame: "#D5DDE8",
    ink: "#13233A",
    muted: "#5E6E85",
    reject: "#B3122E",
    verify: "#1F4FBF",
    cite: "#8A5A00",
    caret: "#13233A",
  },
};

const DRAFT =
  "Nikhil Bhagat is a world-class 10x AI genius whose models never hallucinate.";
const CLAIMS = ["world-class", "10x AI genius", "never hallucinate"];
const REWRITE = "Nikhil Bhagat builds AI systems that have to be right, not just fluent.";
const CITED = "  ✓ NLP research [1]   ✓ agents in production [2]   ✓ open source [3]";
const after = (text, part) => {
  const at = text.indexOf(part);
  if (at < 0) throw new Error(`not found: ${part}`);
  return at + part.length;
};

// Deterministic jitter, so every build and every replay types identically.
let seed = 7;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/**
 * Each line: coloured runs, then how it is revealed.
 *   type   human keystrokes after a printed prefix (the "$ " prompt)
 *   stream word bursts, like tokens from a model
 *   print  the whole line at once
 * `beats` pauses (s) after the given character count; `after` pause at end.
 */
const LINES = [
  { runs: [["muted", "$ nikhil --describe"]], mode: "type", prefix: 2, after: 0.45 },
  { runs: [["ink", DRAFT]], mode: "stream", gap: 0.075, beats: { [DRAFT.indexOf("world-class")]: 0.35 }, after: 1.0 },
  { runs: [["muted", "$ verify --against ./evidence"]], mode: "type", prefix: 2, after: 0.75 },
  {
    runs: [["reject", "  ✗ world-class          "], ["muted", "no evidence found"]],
    mode: "print",
    after: 0.5,
    strike: 0,
  },
  {
    runs: [["reject", "  ✗ 10x AI genius        "], ["muted", "no evidence found"]],
    mode: "print",
    after: 0.5,
    strike: 1,
  },
  {
    runs: [["reject", "  ✗ never hallucinate    "], ["muted", "unfalsifiable, so abstain"]],
    mode: "print",
    after: 0.9,
    strike: 2,
  },
  { runs: [["muted", "$ rewrite --cite"]], mode: "type", prefix: 2, after: 0.5 },
  {
    runs: [["ink", REWRITE]],
    mode: "stream",
    gap: 0.11,
    // The held breath: after "right," the caret waits before "not just fluent."
    beats: { [REWRITE.indexOf("not just")]: 1.1 },
    after: 0.45,
  },
  {
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
    mode: "chunks",
    chunks: ["[1]", "[2]", "[3]"].map((cite) => after(CITED, cite)), // one at a time
    gap: 0.32,
    after: 0.5,
  },
  { runs: [["muted", "exit 0"]], mode: "print", after: 0.3 },
  { runs: [["muted", "$ "]], mode: "print", after: 0 },
];

const escapeXml = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const lineText = (line) => line.runs.map(([, text]) => text).join("");

/** Builds [time, visibleChars] steps for every line and the caret path. */
const timeline = () => {
  let t = 0.4;
  const caret = []; // [time, column, row]
  const pauses = []; // [start, end] windows where the caret blinks
  const reveals = LINES.map((line, row) => {
    const text = lineText(line);
    const steps = [];
    const show = (count) => {
      steps.push([t, count]);
      caret.push([t, count, row]);
    };
    const pause = (seconds) => {
      if (seconds <= 0) return;
      pauses.push([t, t + seconds]);
      t += seconds;
    };
    if (line.mode === "print") show(text.length);
    else if (line.mode === "type") {
      show(line.prefix);
      t += 0.25;
      for (let count = line.prefix + 1; count <= text.length; count += 1) {
        t += 0.045 + random() * 0.07; // 45-115 ms per keystroke
        show(count);
      }
    } else if (line.mode === "stream") {
      let count = 0;
      while (count < text.length) {
        const next = text.indexOf(" ", count + 1);
        count = next < 0 ? text.length : next + 1;
        t += line.gap * (0.6 + random() * 0.8);
        show(count);
        const beat = line.beats?.[count];
        if (beat !== undefined) pause(beat);
      }
    } else if (line.mode === "chunks") {
      for (const count of line.chunks) {
        t += line.gap;
        show(count);
      }
    }
    pause(line.after);
    return { steps, text };
  });
  const end = t + HOLD;
  pauses.push([t, end]);
  return { reveals, caret, pauses, total: end };
};

const { reveals, caret, pauses, total } = timeline();
const pct = (seconds) => `${((seconds / total) * 100).toFixed(3)}%`;

const longest = Math.max(...LINES.map((line) => lineText(line).length));
const WIDTH = PAD_X * 2 + longest * CHAR;
const HEIGHT = TOP + LINES.length * LINE + 14;
const rowY = (row) => TOP + row * LINE;

// Each strike lands the moment its verdict prints.
const strikes = LINES.flatMap((line, row) => {
  if (line.strike === undefined) return [];
  const claim = CLAIMS[line.strike];
  const start = DRAFT.indexOf(claim);
  if (start < 0) throw new Error(`claim not in draft: ${claim}`);
  const at = reveals[row].steps[0][0];
  return [{ x: PAD_X + start * CHAR, width: claim.length * CHAR, at }];
});

const keyframes = () => {
  const blocks = [];
  reveals.forEach(({ steps, text }, row) => {
    const frames = [`0%{clip-path:inset(0 100% 0 0)}`];
    for (const [time, count] of steps)
      frames.push(`${pct(time)}{clip-path:inset(0 ${(100 - (count / text.length) * 100).toFixed(3)}% 0 0)}`);
    frames.push(`100%{clip-path:inset(0 100% 0 0)}`);
    blocks.push(`@keyframes l${row}{${frames.join("")}}`);
  });
  strikes.forEach((strike, index) => {
    blocks.push(
      `@keyframes s${index}{0%{stroke-dashoffset:1}${pct(strike.at)}{stroke-dashoffset:1;animation-timing-function:ease-out}${pct(strike.at + 0.3)}{stroke-dashoffset:0}99.9%{stroke-dashoffset:0}100%{stroke-dashoffset:1}}`,
    );
  });
  const moves = caret.map(
    ([time, column, row]) =>
      `${pct(time)}{transform:translate(${PAD_X + column * CHAR}px,${rowY(row) - 13}px)}`,
  );
  blocks.push(`@keyframes caret{0%{transform:translate(${PAD_X}px,${rowY(0) - 13}px)}${moves.join("")}}`);
  // Solid while typing; blinks (0.5 s period) whenever the session waits.
  const blink = ["0%{opacity:1}"];
  for (const [start, end] of pauses)
    for (let at = start, on = false; at < end; at += 0.5, on = !on)
      blink.push(`${pct(at)}{opacity:${on ? 1 : 0}}`, `${pct(Math.min(at + 0.5, end))}{opacity:1}`);
  blocks.push(`@keyframes blink{${blink.join("")}}`);
  return blocks.join("\n    ");
};

const build = (name) => {
  const t = THEMES[name];
  const rows = LINES.map((line, row) => {
    const text = lineText(line);
    const spans = line.runs
      .map(([tone, run]) => `<tspan fill="${t[tone]}">${escapeXml(run)}</tspan>`)
      .join("");
    return `<text class="l" style="animation-name:l${row}" x="${PAD_X}" y="${rowY(row)}" textLength="${text.length * CHAR}" lengthAdjust="spacingAndGlyphs">${spans}</text>`;
  }).join("\n  ");
  const draftY = rowY(1) - 5;
  const strikeLines = strikes
    .map(
      (s, index) =>
        `<line class="s" style="animation-name:s${index}" x1="${s.x}" y1="${draftY}" x2="${s.x + s.width}" y2="${draftY}" stroke="${t.reject}" stroke-width="2" pathLength="1"/>`,
    )
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">Nikhil Bhagat builds AI systems that have to be right, not just fluent.</title>
  <desc id="desc">A terminal session. A hype biography streams out: Nikhil Bhagat is a world-class 10x AI genius whose models never hallucinate. A verifier strikes out world-class and 10x AI genius for lack of evidence, and never hallucinate as unfalsifiable. The rewrite keeps one cited sentence: Nikhil Bhagat builds AI systems that have to be right, not just fluent, citing NLP research, agents in production and open source.</desc>
  <style>
    text { font-family: "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "DejaVu Sans Mono", monospace; font-size: ${FONT_SIZE}px; white-space: pre; }
    .l, .s, .caret { animation-duration: ${total.toFixed(3)}s; animation-iteration-count: infinite; animation-timing-function: step-end; }
    .l { clip-path: inset(0 100% 0 0); }
    .s { stroke-dasharray: 1; stroke-dashoffset: 1; }
    .caret { animation-name: caret, blink; }
    ${keyframes()}
    @media (prefers-reduced-motion: reduce) {
      .l { clip-path: none; animation: none; }
      .s { stroke-dashoffset: 0; animation: none; }
      .caret { display: none; }
    }
  </style>
  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="10" fill="${t.ground}" stroke="${t.frame}"/>
  <text x="${PAD_X}" y="30" fill="${t.muted}" style="font-size:12px">verify.log</text>
  <line x1="0" y1="42" x2="${WIDTH}" y2="42" stroke="${t.frame}"/>
  ${rows}
  ${strikeLines}
  <rect class="caret" width="${CHAR}" height="17" fill="${t.caret}" opacity="0.85"/>
</svg>
`;
};

mkdirSync(new URL("../assets/", import.meta.url), { recursive: true });
for (const name of Object.keys(THEMES))
  writeFileSync(new URL(`../assets/verify-${name}.svg`, import.meta.url), build(name));
console.log(`built ${WIDTH}x${HEIGHT}, ${longest} columns, loop ${total.toFixed(1)}s`);
