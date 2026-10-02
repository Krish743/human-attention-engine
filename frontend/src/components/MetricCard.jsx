export default function MetricCard({ icon, label, value, sub, small }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: small ? '0.85rem 1rem' : '1.1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{
          fontSize: '0.68rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontWeight: 600
        }}>
          {label}
        </span>
        {icon && <span style={{ color: 'var(--accent-blue)', opacity: 0.7 }}>{icon}</span>}
      </div>

      <div style={{
        fontSize: small ? '1.5rem' : '1.85rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        lineHeight: 1.1,
        fontFamily: 'var(--font-mono)'
      }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 500 }}>
          {sub}
        </div>
      )}
    </div>
  )
}