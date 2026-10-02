import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Activity, Compass, Network, RefreshCw, SlidersHorizontal, Layers } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'

const NAV = [
  { to: '/overview', icon: Activity, label: 'Overview' },
  { to: '/explorer', icon: Compass, label: 'Topic Explorer' },
  { to: '/network', icon: Network, label: 'Attention Network' },
]

export default function Layout() {
  const { gtWeight, setGtWeight, corrThreshold, setCorrThreshold } = useSettings()
  const [refreshing, setRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/refresh', { method: 'POST' })
      window.location.reload()
    } catch {
      alert('Refresh failed. Ensure backend server is running.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        minWidth: 240,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0',
        zIndex: 20
      }}>
        {/* Brand Header */}
        <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: 'var(--accent-blue)',
              borderRadius: 6,
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em', fontFamily: 'var(--font-mono)' }}>
                GHAE TERMINAL
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                Attention Engine
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 1.25rem 0.6rem', fontWeight: 600 }}>
            Analytics Views
          </div>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 1.25rem',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Settings Module */}
        <div style={{ padding: '0 1rem 0.75rem' }}>
          <button
            onClick={() => setShowSettings(s => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.55rem 0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={14} />
              Parameters
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
              {showSettings ? 'CLOSE' : 'EDIT'}
            </span>
          </button>

          {showSettings && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.85rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span>GOOGLE TRENDS</span>
                <span className="mono" style={{ color: 'var(--accent-blue)' }}>{(gtWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={gtWeight}
                onChange={e => setGtWeight(Number(e.target.value))}
                style={{ width: '100%', margin: '0.35rem 0 0.2rem', accentColor: 'var(--accent-blue)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                <span>WIKIPEDIA</span>
                <span className="mono">{((1 - gtWeight) * 100).toFixed(0)}%</span>
              </div>

              <div style={{ marginTop: '0.85rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>CORRELATION THRESHOLD</span>
                  <span className="mono" style={{ color: 'var(--accent-blue)' }}>r ≥ {corrThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  value={corrThreshold}
                  onChange={e => setCorrThreshold(Number(e.target.value))}
                  style={{ width: '100%', margin: '0.35rem 0', accentColor: 'var(--accent-blue)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sync Button */}
        <div style={{ padding: '0 1rem 0.5rem' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.55rem',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 6,
              color: 'var(--accent-blue)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={13} />
            {refreshing ? 'Refreshing...' : 'Sync Signals'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  )
}