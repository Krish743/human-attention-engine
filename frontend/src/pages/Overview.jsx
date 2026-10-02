import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSettings } from '../hooks/useSettings'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Layers, Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import MetricCard from '../components/MetricCard'
import LoadingScreen from '../components/LoadingScreen'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#090f1d',
      border: '1px solid #1e293b',
      borderRadius: 6,
      padding: '0.65rem 0.95rem',
      fontSize: '0.76rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#93c5fd', fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{p.name}:</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Overview() {
  const { gtWeight } = useSettings()
  const [data, setData] = useState(null)
  const [ts, setTs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sel, setSel] = useState([])

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/overview?gt_weight=${gtWeight}`)
      .then(r => {
        setData(r.data)
        setSel(r.data.scoreboard.slice(0, 5).map(t => t.topic))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [gtWeight])

  useEffect(() => {
    if (!sel.length) return
    axios.get(`/api/timeseries?topics=${sel.join(',')}&gt_weight=${gtWeight}`).then(r => {
      const dates = r.data[sel[0]]?.map(d => d.date) || []
      setTs(dates.map(date => {
        const row = { date: date.slice(5) }
        sel.forEach(t => {
          const pt = r.data[t]?.find(d => d.date === date)
          row[t] = pt ? +pt.attention_score.toFixed(1) : null
        })
        return row
      }))
    }).catch(() => {})
  }, [sel, gtWeight])

  if (loading) return <LoadingScreen />
  if (error) {
    return (
      <div className="page-container" style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>
        <strong>Pipeline Error:</strong> {error}
      </div>
    )
  }

  const { kpis, scoreboard, rising, declining } = data
  const COLORS = scoreboard.reduce((acc, t) => {
    acc[t.topic] = t.color || '#3b82f6'
    return acc
  }, {})

  return (
    <div className="page-container">
      {/* Page Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
          GLOBAL ATTENTION ENGINE
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
          Unified index of human search curiosity & encyclopedia information seeking
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <MetricCard icon={<Layers size={18} />} label="Tracked Entities" value={kpis.total_topics} sub="4 Domains" />
        <MetricCard icon={<Activity size={18} />} label="Peak Attention Index" value={kpis.top_score ? kpis.top_score.toFixed(1) : '0.0'} sub={kpis.top_topic} />
        <MetricCard icon={<TrendingUp size={18} />} label="Surging Topics" value={kpis.rising_count} sub="7D Acceleration" />
        <MetricCard icon={<TrendingDown size={18} />} label="Decaying Topics" value={kpis.declining_count} sub="7D Deceleration" />
      </div>

      {/* Main Scoreboard & Side Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Ranked Attention Scoreboard */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem' }}>
          <SectionHeader title="Attention Scoreboard" badge="RANKED" />
          <div style={{ overflowY: 'auto', maxHeight: 380, paddingRight: '0.25rem' }}>
            {scoreboard.map((t, i) => {
              const isSelected = sel.includes(t.topic)
              return (
                <div
                  key={t.topic}
                  onClick={() => setSel(p => p.includes(t.topic) ? p.filter(x => x !== t.topic) : [...p.slice(-4), t.topic])}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 4,
                    marginBottom: '0.3rem',
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-elevated)',
                    border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.45)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', width: 20, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 3,
                    background: `${t.color}20`,
                    color: t.color,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {t.category.toUpperCase().slice(0, 4)}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 500, color: '#f1f5f9' }}>
                    {t.topic}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? t.color : '#f8fafc', width: 50, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {t.current_score?.toFixed(1)}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    width: 54,
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)',
                    color: t.growth_7d > 0.5 ? '#34d399' : t.growth_7d < -0.5 ? '#f87171' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.15rem'
                  }}>
                    {t.growth_7d > 0.5 ? <ArrowUpRight size={13} /> : t.growth_7d < -0.5 ? <ArrowDownRight size={13} /> : <Minus size={11} />}
                    {t.growth_7d ? Math.abs(t.growth_7d).toFixed(1) : '0.0'}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <span>Click rows to toggle in comparison timeline (up to 5)</span>
            <span className="mono">{sel.length} SELECTED</span>
          </div>
        </div>

        {/* Dynamic Movers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Surging */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem', flex: 1 }}>
            <SectionHeader title="Top Acceleration" icon={<TrendingUp size={14} />} badge="7D DELTA" />
            {rising.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No topics with positive delta.</p>
            ) : (
              rising.map(t => (
                <div key={t.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f1f5f9' }}>{t.topic}</span>
                  <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <ArrowUpRight size={13} />+{t.growth_7d?.toFixed(1)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Top Decaying */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem', flex: 1 }}>
            <SectionHeader title="Top Deceleration" icon={<TrendingDown size={14} />} badge="7D DELTA" />
            {declining.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No topics with negative delta.</p>
            ) : (
              declining.map(t => (
                <div key={t.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f1f5f9' }}>{t.topic}</span>
                  <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <ArrowDownRight size={13} />{t.growth_7d?.toFixed(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Multi-Topic Comparative Timeline */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem', marginBottom: '1.5rem' }}>
        <SectionHeader title="Attention Trajectories" badge="0-100 INDEX" />
        {ts && ts.length > 0 ? (
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={ts} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
              <defs>
                {sel.map(t => {
                  const c = COLORS[t] || '#3b82f6'
                  return (
                    <linearGradient key={t} id={`g_${t.replace(/\s/g, '_')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  )
                })}
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} domain={[0, 100]} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem', color: '#94a3b8' }} />
              {sel.map(t => {
                const c = COLORS[t] || '#3b82f6'
                return (
                  <Area
                    key={t}
                    type="monotone"
                    dataKey={t}
                    stroke={c}
                    strokeWidth={2}
                    fill={`url(#g_${t.replace(/\s/g, '_')})`}
                    dot={false}
                    activeDot={{ r: 4, fill: c }}
                    connectNulls
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>
            Select topics from the scoreboard to inspect attention trajectories
          </p>
        )}
      </div>

      {/* Distribution Across Topics */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem' }}>
        <SectionHeader title="Attention Distribution" badge="ALL ENTITIES" />
        <ResponsiveContainer width="100%" height={Math.max(380, scoreboard.length * 26)}>
          <BarChart data={[...scoreboard].sort((a, b) => a.current_score - b.current_score)} layout="vertical" margin={{ top: 5, right: 60, left: 90, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
            <YAxis type="category" dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#1e293b' }} width={90} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="current_score" name="Attention Score" fill="#3b82f6" radius={[0, 3, 3, 0]} label={{ position: 'right', fill: '#94a3b8', fontSize: 10, fontFamily: 'var(--font-mono)', formatter: v => v.toFixed(1) }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}