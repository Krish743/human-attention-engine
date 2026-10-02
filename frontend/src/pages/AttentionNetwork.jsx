import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import * as d3 from 'd3'
import { useSettings } from '../hooks/useSettings'
import SectionHeader from '../components/SectionHeader'
import MetricCard from '../components/MetricCard'
import LoadingScreen from '../components/LoadingScreen'
import { Network, Link2, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

function nodeRadius(d) {
  return Math.max(16, (d.current_score || 0) * 0.35 + 12)
}

function HeatMap({ matrix }) {
  const topics = matrix.topics
  const values = matrix.values
  const n = topics.length
  const cellSize = Math.min(38, Math.floor(700 / n))
  const getColor = v => {
    if (v > 0.7) return `rgba(6, 182, 212, ${Math.min(1, v)})`
    if (v > 0.4) return `rgba(99, 102, 241, ${v})`
    if (v > 0) return `rgba(30, 41, 59, ${v + 0.3})`
    return `rgba(239, 68, 68, ${Math.min(0.6, Math.abs(v))})`
  }
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: 100, textAlign: 'left', fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOPIC</th>
            {topics.map(t => (
              <th key={t} style={{ width: cellSize, height: cellSize * 1.8, color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.62rem', writingMode: 'vertical-rl', padding: '0 4px', fontFamily: 'var(--font-mono)' }}>
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topics.map((rowTopic, i) => (
            <tr key={rowTopic}>
              <td style={{ color: 'var(--text-secondary)', paddingRight: 8, fontSize: '0.72rem', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {rowTopic}
              </td>
              {topics.map((colTopic, j) => {
                const v = values[i]?.[j] ?? 0
                return (
                  <td
                    key={colTopic}
                    title={`${rowTopic} vs ${colTopic}: ${v.toFixed(2)}`}
                    style={{
                      height: 28,
                      background: getColor(v),
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid rgba(15, 23, 42, 0.8)',
                      cursor: 'default'
                    }}
                  >
                    {v.toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AttentionNetwork() {
  const { gtWeight, corrThreshold } = useSettings()
  const [netData, setNetData] = useState(null)
  const [loading, setLoading] = useState(true)
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const simRef = useRef(null)
  const zoomBehaviorRef = useRef(null)
  const svgSelectRef = useRef(null)
  const gContainerRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/network?threshold=${corrThreshold}&gt_weight=${gtWeight}`)
      .then(r => setNetData(r.data))
      .finally(() => setLoading(false))
  }, [corrThreshold, gtWeight])

  useEffect(() => {
    if (!netData || !svgRef.current) return
    const { nodes, edges } = netData
    const el = svgRef.current
    const W = el.clientWidth || 900
    const H = 520

    d3.select(el).selectAll('*').remove()
    const svg = d3.select(el).attr('width', W).attr('height', H).style('background', '#090f1d')
    svgSelectRef.current = svg

    // Container for zoom and pan
    const gContainer = svg.append('g').attr('class', 'network-container')
    gContainerRef.current = gContainer

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform)
      })

    svg.call(zoom)
    zoomBehaviorRef.current = zoom

    const nodesData = nodes.map(n => ({
      ...n,
      x: W / 2 + (Math.random() - 0.5) * 200,
      y: H / 2 + (Math.random() - 0.5) * 200
    }))
    const edgesData = edges.map(e => ({ ...e }))

    // Controlled, bounded force simulation
    const sim = d3.forceSimulation(nodesData)
      .force('link', d3.forceLink(edgesData).id(d => d.id).distance(d => 110 - d.weight * 50).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-90).distanceMax(350))
      .force('center', d3.forceCenter(W / 2, H / 2).strength(0.15))
      .force('x', d3.forceX(W / 2).strength(0.08))
      .force('y', d3.forceY(H / 2).strength(0.08))
      .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 12).strength(0.9))

    simRef.current = sim

    const link = gContainer.append('g').selectAll('line').data(edgesData).join('line')
      .attr('stroke', '#334155').attr('stroke-opacity', d => Math.min(1, 0.4 + d.weight * 0.6))
      .attr('stroke-width', d => Math.max(1, d.weight * 3.5))

    const nodeG = gContainer.append('g').selectAll('g').data(nodesData).join('g')
      .style('cursor', 'grab')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))

    nodeG.append('circle').attr('r', d => nodeRadius(d))
      .attr('fill', d => d.color + '25').attr('stroke', d => d.color).attr('stroke-width', 2)

    nodeG.append('text').text(d => d.id).attr('text-anchor', 'middle')
      .attr('dy', d => nodeRadius(d) + 15).attr('fill', '#94a3b8').attr('font-size', 11).attr('font-weight', 500)

    nodeG.append('text').text(d => d.current_score.toFixed(0)).attr('text-anchor', 'middle')
      .attr('dy', '0.35em').attr('fill', d => d.color).attr('font-size', d => Math.max(10, nodeRadius(d) * 0.7))
      .attr('font-weight', 700).attr('font-family', 'JetBrains Mono, monospace')

    nodeG.on('mouseenter', (event, d) => {
      const connected = edgesData.filter(e => e.source.id === d.id || e.target.id === d.id)
        .map(e => `${e.source.id === d.id ? e.target.id : e.source.id} (r=${e.weight.toFixed(2)})`)
      setTooltip({ x: event.clientX, y: event.clientY, node: d, connected })
    }).on('mouseleave', () => setTooltip(null))

    sim.on('tick', () => {
      // Contain nodes inside the boundary box so they never escape or scatter infinitely
      nodesData.forEach(d => {
        const r = nodeRadius(d) + 20
        d.x = Math.max(r, Math.min(W - r, d.x))
        d.y = Math.max(r, Math.min(H - r, d.y))
      })

      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => sim.stop()
  }, [netData])

  // Recenter & Reset simulation handler
  const handleRecenter = () => {
    if (!svgSelectRef.current || !zoomBehaviorRef.current || !simRef.current || !netData) return
    const el = svgRef.current
    const W = el.clientWidth || 900
    const H = 520

    // Reset Zoom to default identity
    svgSelectRef.current.transition().duration(500).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity
    )

    // Pull all nodes back toward center with high alpha
    const sim = simRef.current
    sim.nodes().forEach(d => {
      d.fx = null
      d.fy = null
      d.vx = (W / 2 - d.x) * 0.1
      d.vy = (H / 2 - d.y) * 0.1
    })
    sim.alpha(0.8).restart()
  }

  const handleZoom = (factor) => {
    if (!svgSelectRef.current || !zoomBehaviorRef.current) return
    svgSelectRef.current.transition().duration(250).call(
      zoomBehaviorRef.current.scaleBy,
      factor
    )
  }

  if (loading) return <LoadingScreen />
  const { stats, correlation_matrix: cm } = netData || {}
  const edges = netData?.edges || []
  const topEdges = [...edges].sort((a, b) => b.weight - a.weight).slice(0, 10)

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          ATTENTION TOPOLOGY NETWORK
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
          Graph representation of synchronous attention fluctuations · Bounded containment physics
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Network Graph with Controls */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <div style={{ padding: '0.9rem 1.1rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionHeader title="Dynamic Force Graph" color="var(--accent-blue)" badge="CONTAINED GRAVITY" />

            {/* View Controls Toolbar */}
            <div style={{ display: 'flex', gap: '0.4rem', position: 'relative', top: -4 }}>
              <button
                onClick={handleRecenter}
                title="Recenter & Reset Node Layout"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.6rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'var(--accent-blue)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} />
                Recenter
              </button>

              <button
                onClick={() => handleZoom(1.25)}
                title="Zoom In"
                style={{
                  padding: '0.3rem 0.5rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <ZoomIn size={14} />
              </button>

              <button
                onClick={() => handleZoom(0.8)}
                title="Zoom Out"
                style={{
                  padding: '0.3rem 0.5rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <ZoomOut size={14} />
              </button>
            </div>
          </div>

          <svg ref={svgRef} style={{ width: '100%', height: 520, display: 'block' }} />

          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 16,
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(9, 15, 29, 0.8)',
            padding: '0.2rem 0.5rem',
            borderRadius: 4,
            border: '1px solid var(--border-light)',
            pointerEvents: 'none'
          }}>
            Scroll to zoom · Drag canvas to pan · Drag nodes to position
          </div>
        </div>

        {/* Stats & Edge List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <MetricCard icon={<Network size={16} />} label="Total Nodes" value={stats?.node_count} sub="Entities" accent="var(--accent-blue)" small />
            <MetricCard icon={<Link2 size={16} />} label="Active Edges" value={stats?.edge_count} sub={`r ≥ ${corrThreshold.toFixed(2)}`} accent="var(--accent-cyan)" small />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem', flex: 1 }}>
            <SectionHeader title="Strongest Correlations" color="var(--accent-green)" badge="PEARSON R" />
            {topEdges.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No edges at current threshold. Lower threshold in settings.</p>
            ) : (
              topEdges.map((e, i) => {
                const r = e.weight
                const barColor = r > 0.85 ? 'var(--accent-cyan)' : r > 0.7 ? 'var(--accent-amber)' : 'var(--text-muted)'
                return (
                  <div key={i} style={{ padding: '0.45rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{e.source} ↔ {e.target}</span>
                      <span style={{ fontWeight: 700, color: barColor, fontFamily: 'var(--font-mono)' }}>{r.toFixed(2)}</span>
                    </div>
                    <div style={{ marginTop: 4, height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${barColor} ${(r * 100).toFixed(0)}%, var(--border) ${(r * 100).toFixed(0)}%)` }} />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      {cm && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.1rem' }}>
          <SectionHeader title="Cross-Entity Correlation Matrix" color="var(--accent-purple)" badge="PAIRWISE SIMILARITY" />
          <HeatMap matrix={cm} />
        </div>
      )}

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y + 12,
          background: '#090f1d',
          border: `1px solid ${tooltip.node.color}`,
          borderRadius: 6,
          padding: '0.75rem 1rem',
          fontSize: '0.75rem',
          zIndex: 999,
          pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
        }}>
          <div style={{ fontWeight: 700, color: tooltip.node.color, marginBottom: 4 }}>{tooltip.node.id}</div>
          <div style={{ color: 'var(--text-muted)' }}>Attention Score: <span className="mono" style={{ color: 'var(--text-primary)' }}>{tooltip.node.current_score.toFixed(1)}</span></div>
          <div style={{ color: 'var(--text-muted)' }}>Category: <span style={{ color: 'var(--text-primary)' }}>{tooltip.node.category}</span></div>
          {tooltip.connected.length > 0 && (
            <div style={{ marginTop: 6, borderTop: '1px solid var(--border)', paddingTop: 4 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Connected Nodes:</div>
              {tooltip.connected.map((c, i) => (
                <div key={i} style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{c}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}