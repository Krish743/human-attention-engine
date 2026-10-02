export default function SectionHeader({ title, icon, badge }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: '0.65rem',
      borderBottom: '1px solid var(--border)',
      marginBottom: '0.85rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon && <span style={{ color: 'var(--text-secondary)', display: 'flex' }}>{icon}</span>}
        <span style={{
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          fontWeight: 700
        }}>
          {title}
        </span>
      </div>
      {badge && (
        <span style={{
          fontSize: '0.65rem',
          fontFamily: 'var(--font-mono)',
          padding: '0.15rem 0.45rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          color: 'var(--text-muted)'
        }}>
          {badge}
        </span>
      )}
    </div>
  )
}