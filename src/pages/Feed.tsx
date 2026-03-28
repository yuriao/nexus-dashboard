import { useEffect, useState } from 'react'
import { getCompanies, getDataPoints } from '../api'
import { formatDistanceToNow } from 'date-fns'

const SOURCE_STYLE: Record<string, { icon: string; cls: string }> = {
  news:       { icon: '📰', cls: 'badge-blue' },
  jobs:       { icon: '💼', cls: 'badge-green' },
  crunchbase: { icon: '🚀', cls: 'badge-purple' },
  linkedin:   { icon: '🔗', cls: 'badge-yellow' },
  custom:     { icon: '🔍', cls: 'badge-gray' },
}

export default function Feed() {
  const [companies, setCompanies] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [sourceFilter, setSourceFilter] = useState('')
  const [points, setPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCompanies().then((r) => {
      const list = r.data.results ?? r.data
      setCompanies(list)
      if (list.length > 0) setSelected(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    getDataPoints(selected, sourceFilter || undefined)
      .then((r) => setPoints(r.data.results ?? r.data))
      .catch(() => setPoints([]))
      .finally(() => setLoading(false))
  }, [selected, sourceFilter])

  return (
    <div>
      <div className="page-header">
        <h1>Intelligence Feed</h1>
        <p>Raw data points gathered by the scraper service</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="input" style={{ maxWidth: 220 }}
          value={selected ?? ''} onChange={(e) => setSelected(Number(e.target.value))}>
          <option value="">— select company —</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select className="input" style={{ maxWidth: 160 }}
          value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          {Object.keys(SOURCE_STYLE).map((s) => (
            <option key={s} value={s}>{SOURCE_STYLE[s].icon} {s}</option>
          ))}
        </select>

        {/* Source count pills */}
        {!loading && Object.entries(
          points.reduce((acc: Record<string, number>, p) => {
            acc[p.source_type] = (acc[p.source_type] ?? 0) + 1
            return acc
          }, {})
        ).map(([src, count]) => (
          <span key={src}
            className={`badge ${SOURCE_STYLE[src]?.cls ?? 'badge-gray'}`}
            style={{ padding: '4px 10px', cursor: 'pointer' }}
            onClick={() => setSourceFilter(src === sourceFilter ? '' : src)}>
            {SOURCE_STYLE[src]?.icon} {src} · {count}
          </span>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" /></div>}

      {!loading && !selected && (
        <div className="empty"><div className="empty-icon">📡</div><h3>Select a company</h3></div>
      )}

      {!loading && selected && points.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <h3>No data points yet</h3>
          <p>Trigger a report to start scraping intelligence</p>
        </div>
      )}

      {!loading && points.map((p) => {
        const s = SOURCE_STYLE[p.source_type] ?? SOURCE_STYLE.custom
        return (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className={`badge ${s.cls}`}>{s.icon} {p.source_type}</span>
              {p.confidence_score && (
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  conf. {(parseFloat(p.confidence_score) * 100).toFixed(0)}%
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#475569' }}>
                {p.extracted_at ? formatDistanceToNow(new Date(p.extracted_at), { addSuffix: true }) : ''}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: 8 }}>
              {p.raw_text?.slice(0, 400)}{p.raw_text?.length > 400 ? '…' : ''}
            </div>
            {p.source_url && (
              <a href={p.source_url} target="_blank" rel="noreferrer"
                style={{ fontSize: '0.72rem', color: '#475569', wordBreak: 'break-all' }}>
                🔗 {p.source_url.slice(0, 80)}{p.source_url.length > 80 ? '…' : ''}
              </a>
            )}
            {p.structured_json && Object.keys(p.structured_json).length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ fontSize: '0.72rem', color: '#64748b', cursor: 'pointer' }}>Structured data</summary>
                <pre style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#050810', padding: 10, borderRadius: 4, marginTop: 6, overflow: 'auto' }}>
                  {JSON.stringify(p.structured_json, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )
      })}
    </div>
  )
}
