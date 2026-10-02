import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSettings } from '../hooks/useSettings'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import SectionHeader from '../components/SectionHeader'
import MetricCard from '../components/MetricCard'
import LoadingScreen from '../components/LoadingScreen'
import { Zap, Clock, Activity, BarChart2, Target } from 'lucide-react'

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
        <div key={i} style={{ color: '#93c5fd', fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{p.name}:</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TopicExplorer() {
  const { gtWeight } = useSettings()
  const [categories, setCategories] = useState({})
  const [selected, setSelected] = useState('')
  const [topicData, setTopicData] = useState(null)
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingTopic, setLoadingTopic] = useState(false)

  useEffect(() => {
    axios.get('/api/categories').then(r => {
      setCategories(r.data)
      const first = Object.values(r.data)[0]?.topics[0]
      if (first) setSelected(first)
    }).finally(() => setLoadingCats(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoadingTopic(true)
    axios.get(`/api/topic/${encodeURIComponent(selected)}?gt_weight=${gtWeight}`)
      .then(r => setTopicData(r.data))
      .catch(console.error)
      .finally(() => setLoadingTopic(false))
  }, [selected, gtWeight])

  if (loadingCats) return <LoadingScreen />

  const m = topicData?.metrics
  const ts = topicData?.timeseries || []

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#ffffff' }}>
          TOPIC EXPLORER
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
          Signal decomposition, velocity derivatives, and decay modeling
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '0.85rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {Object.entries(categories).map(([cat, meta]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.65rem',
              color: 'var(--accent-blue)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              marginRight: '0.2rem'
            }}>
              {cat}
            </span>
            {meta.topics.map(t => {
              const isSel = selected === t
              return (
                <button
                  key={t}
                  onClick={() => setSelected(t)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 4,
                    fontSize: '0.72rem',
                    fontWeight: isSel ? 600 : 500,
                    border: `1px solid ${isSel ? 'var(--accent-blue)' : 'var(--border)'}`,
                    background: isSel ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-elevated)',
                    color: isSel ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {loadingTopic ? <LoadingScreen /> : !topicData ? null : (
        <>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>{selected}</span>
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 4,
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--accent-blue)',
                  fontWeight: 700
                }}>
                  {topicData.category.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Composite index derived from search interest & encyclopedia demand
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-blue)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
                {m?.current_score?.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                Attention Score
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <MetricCard icon={<Target size={16} />} label="All-Time Peak" value={m?.peak_score?.toFixed(1)} sub="Max observed index" small />
            <MetricCard icon={<BarChart2 size={16} />} label="Mean Attention" value={m?.avg_score?.toFixed(1)} sub="Historical baseline" small />
            <MetricCard icon={<Activity size={16} />} label="Volatility (σ)" value={m?.volatility?.toFixed(2)} sub="Attention dispersion" small />
            <MetricCard icon={<Zap size={16} />} label="Velocity (d/dt)" value={`${m?.latest_velocity >= 0 ? '+' : ''}${m?.latest_velocity?.toFixed(2)}`} sub="Instantaneous slope" small />
            <MetricCard icon={<Clock size={16} />} label="Decay Half-Life" value={m?.half_life_days != null ? `${Math.round(m.half_life_days)}d` : 'Sustained'} sub={m?.half_life_days != null ? 'Decay to 50% peak' : 'No decay observed'} small />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem', marginBottom: '1.25rem' }}>
            <SectionHeader title="Attention Score Trajectory" badge="90-DAY TIME SERIES" />
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ts} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} domain={[0, 100]} />
                <Tooltip content={<Tip />} />
                <ReferenceLine y={m?.peak_score} stroke="#60a5fa" strokeDasharray="4 4" label={{ value: `Peak: ${m?.peak_score?.toFixed(1)}`, fill: '#60a5fa', fontSize: 10, position: 'right', fontFamily: 'var(--font-mono)' }} />
                <Area type="monotone" dataKey="attention_score" name="Attention Score" stroke="#3b82f6" strokeWidth={2.5} fill="url(#ag)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem' }}>
              <SectionHeader title="Signal Decomposition" badge="DUAL PROXIES" />
              <div style={{ marginBottom: '0.6rem', display: 'flex', gap: '1.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 2, background: '#3b82f6', display: 'inline-block' }} /> Google Trends ({(gtWeight * 100).toFixed(0)}%)
                </span>
                <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 2, background: '#60a5fa', display: 'inline-block', borderTop: '2px dashed #60a5fa' }} /> Wikipedia ({((1 - gtWeight) * 100).toFixed(0)}%)
                </span>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={ts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} domain={[0, 100]} />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="gt_norm" name="Google Trends" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="wiki_norm" name="Wikipedia" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem' }}>
              <SectionHeader title="Attention Velocity Vector" badge="1ST DERIVATIVE" />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Gradient rate of change per diurnal cycle
              </p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={ts} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
                  <Tooltip content={<Tip />} />
                  <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />
                  <Bar dataKey="velocity" name="Velocity" radius={[2, 2, 0, 0]}>
                    {ts.map((e, i) => (
                      <Cell key={i} fill={e.velocity >= 0 ? '#3b82f6' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}