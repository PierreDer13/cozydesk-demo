const PIXELS = [
  "...gg.gg........",
  ".....g..........",
  "......g.........",
  "...tttttttt.....",
  "...tttttttttt...",
  "...tttyyttt.t...",
  "...tttyyttt.t...",
  "...tttttttttt...",
  "...tttttttt.....",
  "..bbbbbbbbbb....",
]

const COLORS = {
  g: "var(--green)",
  t: "var(--terracotta)",
  y: "var(--yellow)",
  b: "var(--brown)",
}

function MugLogo({ size = 40 }) {
  return (
    <svg viewBox="0 0 16 10" width={size} height={size * 10 / 16} shapeRendering="crispEdges">
      {PIXELS.map((row, y) =>
        [...row].map((char, x) =>
          char === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLORS[char]} />
          )
        )
      )}
    </svg>
  )
}

export default MugLogo