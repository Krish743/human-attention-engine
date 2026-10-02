import { Activity } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '65vh',
      gap: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-blue)',
        animation: 'pulse-subtle 1.5s infinite ease-in-out'
      }}>
        <Activity size={28} />
      </div>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600
      }}>
        Aggregating Signal Matrices...
      </div>
    </div>
  )
}