export default function ScoreBar({ score, color }) {
  return (
    <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, score || 0))}%`, background: color || "var(--accent-blue)", borderRadius: 2, transition: "width 0.5s ease" }} />
    </div>
  )
}