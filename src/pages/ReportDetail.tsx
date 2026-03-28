import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport, getReportStatus } from '../api'
import { formatDistanceToNow } from 'date-fns'

const STATUS_BADGE: Record<string, string> = {
  completed: 'badge-green', running: 'badge-blue',
  pending: 'badge-yellow', failed: 'badge-red',
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [wsLog, setWsLog] = useState<Array<{ text: string; type: string }>>([])
  const wsRef = useRef<WebSocket | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // Poll status while running/pending
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = () =>
    getReport(id!)
      .then((r) => setReport(r.data))
      .finally(() => setLoading(false))

  const connectWs = () => {
    const wsBase = (import.meta.env.VITE_API_URL ?? 'http://localhost:80').replace(/^http/, 'ws')
    const token = localStorage.getItem('nexus_access')
    const ws = new WebSocket(`${wsBase}/ws/reports/${id}/?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const type = data.type === 'report_complete' ? 'done' : data.type === 'error' ? 'error' : 'agent'
      setWsLog((l) => [...l, { text: data.message ?? JSON.stringify(data), type }])
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight

      if (data.type === 'report_complete') {
        ws.close()
        load()
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }
    ws.onerror = () => setWsLog((l) => [...l, { text: 'WebSocket connection failed — polling instead', type: 'error' }])
  }

  useEffect(() => {
    load()
  }, [id])

  useEffect(() => {
    if (!report) return
    if (report.status === 'running' || report.status === 'pending') {
      connectWs()
      // Fallback poll every 5s
      pollRef.current = setInterval(() => {
        getReportStatus(id!).then((r) => {
          if (r.data.status === 'completed' || r.data.status === 'failed') {
            clearInterval(pollRef.current!)
            load()
          }
        })
      }, 5000)
    }
    return () => {
      wsRef.current?.close()
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [report?.status])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
  if (!report) return <div className="empty"><h3>Report not found</h3></div>

  const isLive = report.status === 'running' || report.status === 'pending'

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/reports')}>
          ← All reports
        </button>
      </div>

      {/* Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
              {report.company_name ?? `Company #${report.company}`}
            </h2>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#64748b' }}>
              <span>Created {report.created_at ? formatDistanceToNow(new Date(report.created_at), { addSuffix: true }) : ''}</span>
              {report.completed_at && <span>Completed {formatDistanceToNow(new Date(report.completed_at), { addSuffix: true })}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {report.confidence_score && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                  {(parseFloat(report.confidence_score) * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Confidence</div>
              </div>
            )}
            <span className={`badge ${STATUS_BADGE[report.status] ?? 'badge-gray'}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
              {isLive && <span style={{ marginRight: 4 }}>⏳</span>}{report.status}
            </span>
          </div>
        </div>
      </div>

      {/* Live log */}
      {(isLive || wsLog.length > 0) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Live Agent Progress</div>
          <div className="ws-log" ref={logRef}>
            {wsLog.length === 0 && <div style={{ color: '#475569' }}>Waiting for agent...</div>}
            {wsLog.map((l, i) => (
              <div key={i} className={`ws-log-line ${l.type}`}>
                {l.type === 'agent' ? '▸ ' : l.type === 'done' ? '✓ ' : '✗ '}{l.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed */}
      {report.status === 'failed' && report.error_message && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="card-title" style={{ color: '#f87171' }}>Error</div>
          <div style={{ color: '#fca5a5', fontSize: '0.82rem', fontFamily: 'monospace' }}>{report.error_message}</div>
        </div>
      )}

      {report.status === 'completed' && (
        <div className="grid-2">
          <div>
            {/* Summary */}
            {report.summary && (
              <div className="card report-section" style={{ marginBottom: 20 }}>
                <h3>Executive Summary</h3>
                <p className="report-prose">{report.summary}</p>
              </div>
            )}

            {/* Sections */}
            {(report.sections ?? []).map((s: any) => (
              <div key={s.id} className="card report-section" style={{ marginBottom: 20 }}>
                <h3>{s.section_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</h3>
                <p className="report-prose">{s.content}</p>
              </div>
            ))}
          </div>

          <div>
            {/* Opportunities */}
            {report.opportunities?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">🟢 Opportunities</div>
                <div className="insight-list">
                  {report.opportunities.map((o: string, i: number) => (
                    <div key={i} className="insight-item">
                      <span style={{ color: '#34d399', flexShrink: 0 }}>↑</span>
                      <span>{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {report.risks?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">🔴 Risks</div>
                <div className="insight-list">
                  {report.risks.map((r: string, i: number) => (
                    <div key={i} className="insight-item">
                      <span style={{ color: '#f87171', flexShrink: 0 }}>↓</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predictions */}
            {report.predictions?.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">🔮 Predictions</div>
                <div className="insight-list">
                  {report.predictions.map((p: string, i: number) => (
                    <div key={i} className="insight-item">
                      <span style={{ color: '#a5b4fc', flexShrink: 0 }}>◆</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence */}
            {report.confidence_score && (
              <div className="card">
                <div className="card-title">Confidence Score</div>
                <div style={{ marginBottom: 8 }}>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: `${parseFloat(report.confidence_score) * 100}%` }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {(parseFloat(report.confidence_score) * 100).toFixed(1)}% — rated by the Critic agent
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
