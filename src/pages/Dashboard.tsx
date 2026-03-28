import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { listReports, getCompanies } from '../api'

const STATUS_BADGE: Record<string, string> = {
  completed: 'badge-green', running: 'badge-blue',
  pending: 'badge-yellow', failed: 'badge-red',
}

export default function Dashboard() {
  const [reports, setReports] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([listReports(), getCompanies()])
      .then(([r, c]) => {
        setReports(r.data.results ?? r.data)
        setCompanies(c.data.results ?? c.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completed = reports.filter((r) => r.status === 'completed')
  const running   = reports.filter((r) => r.status === 'running')
  const avgConf   = completed.length
    ? (completed.reduce((s, r) => s + parseFloat(r.confidence_score ?? 0), 0) / completed.length * 100).toFixed(0)
    : '—'

  return (
    <div>
      <div className="page-header">
        <h1>Intelligence Dashboard</h1>
        <p>Overview of gathered competitive intelligence</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#60a5fa' }}>{companies.length}</div>
          <div className="stat-label">Companies tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#34d399' }}>{completed.length}</div>
          <div className="stat-label">Reports completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#fbbf24' }}>{running.length}</div>
          <div className="stat-label">Reports running</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#a5b4fc' }}>{avgConf}%</div>
          <div className="stat-label">Avg confidence</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent reports */}
        <div className="card">
          <div className="card-title">Recent Reports</div>
          {loading && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></div>}
          {!loading && reports.length === 0 && (
            <div className="empty"><div className="empty-icon">📭</div><h3>No reports yet</h3></div>
          )}
          {reports.slice(0, 8).map((r) => (
            <div key={r.id} onClick={() => navigate(`/reports/${r.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1f2d40', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{r.company_name ?? r.company}</div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>
                  {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : ''}
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-gray'}`}>{r.status}</span>
              {r.confidence_score && (
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {(parseFloat(r.confidence_score) * 100).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Watched companies */}
        <div className="card">
          <div className="card-title">Tracked Companies</div>
          {loading && <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></div>}
          {!loading && companies.length === 0 && (
            <div className="empty"><div className="empty-icon">🏢</div><h3>No companies yet</h3></div>
          )}
          {companies.slice(0, 10).map((c) => (
            <div key={c.id} onClick={() => navigate(`/companies/${c.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1f2d40', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e2535', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                🏢
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{c.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{c.domain} · {c.sector}</div>
              </div>
              {c.last_crawled_at && (
                <span style={{ fontSize: '0.7rem', color: '#475569' }}>
                  {formatDistanceToNow(new Date(c.last_crawled_at), { addSuffix: true })}
                </span>
              )}
            </div>
          ))}
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: '0.75rem' }}
            onClick={() => navigate('/companies')}>
            View all →
          </button>
        </div>
      </div>
    </div>
  )
}
