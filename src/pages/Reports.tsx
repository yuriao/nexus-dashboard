import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listReports } from '../api'
import { formatDistanceToNow } from 'date-fns'

const STATUS_BADGE: Record<string, string> = {
  completed: 'badge-green', running: 'badge-blue',
  pending: 'badge-yellow', failed: 'badge-red',
}

export default function Reports() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const navigate = useNavigate()

  const load = (p: number) => {
    setLoading(true)
    listReports(p)
      .then((r) => {
        const data = r.data
        setReports(data.results ?? data)
        setHasMore(!!(data.next))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

  return (
    <div>
      <div className="page-header">
        <h1>Research Reports</h1>
        <p>All AI-generated competitive intelligence reports</p>
      </div>

      <div className="card">
        {loading && <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" /></div>}
        {!loading && reports.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <h3>No reports yet</h3>
            <p>Trigger a report from the Companies page</p>
          </div>
        )}
        {reports.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Company</th><th>Status</th><th>Confidence</th>
                    <th>Created</th><th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/reports/${r.id}`)}>
                      <td style={{ fontWeight: 600 }}>{r.company_name ?? r.company}</td>
                      <td><span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-gray'}`}>{r.status}</span></td>
                      <td>
                        {r.confidence_score ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="confidence-bar" style={{ width: 60 }}>
                              <div className="confidence-fill" style={{ width: `${parseFloat(r.confidence_score) * 100}%` }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {(parseFloat(r.confidence_score) * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : '—'}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {r.completed_at ? formatDistanceToNow(new Date(r.completed_at), { addSuffix: true }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-ghost" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
