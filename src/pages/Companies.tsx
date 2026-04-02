import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCompanies, createCompany, triggerReport } from '../api'
import { formatDistanceToNow } from 'date-fns'

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [triggering, setTriggering] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', domain: '', sector: '', country: '' })
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()

  const load = (q = '') => {
    setLoading(true)
    getCompanies(q)
      .then((r) => setCompanies(r.data.results ?? r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    load(e.target.value)
  }

  const handleAdd = async () => {
    setAdding(true)
    try {
      await createCompany(form)
      setShowAdd(false)
      setForm({ name: '', domain: '', sector: '', country: '' })
      load()
    } catch (e: any) {
      const data = e.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
        alert(msgs)
      } else {
        alert(e.message ?? 'Failed to add company')
      }
    } finally {
      setAdding(false)
    }
  }

  const handleTrigger = async (companyId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setTriggering(companyId)
    try {
      const { data } = await triggerReport(companyId)
      navigate(`/reports/${data.report_id ?? data.id}`)
    } catch (e: any) {
      alert(e.response?.data?.detail ?? 'Failed to trigger report')
    } finally {
      setTriggering(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Companies</h1>
        <p>Manage tracked companies and trigger intelligence reports</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="Search companies..."
          value={search} onChange={handleSearch} />
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>+ Add Company</button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>New Company</div>
          <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
            {[['name','Company name'],['domain','Domain (e.g. openai.com)'],['sector','Sector'],['country','Country']].map(([k, placeholder]) => (
              <input key={k} className="input" placeholder={placeholder}
                value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding...' : 'Add'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        {loading && <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" /></div>}
        {!loading && companies.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🏢</div>
            <h3>No companies found</h3>
            <p>Add a company to start tracking competitive intelligence</p>
          </div>
        )}
        {companies.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th><th>Domain</th><th>Sector</th><th>Country</th>
                  <th>Last Crawled</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/companies/${c.id}`)}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: '#64748b' }}>{c.domain}</td>
                    <td>{c.sector && <span className="badge badge-blue">{c.sector}</span>}</td>
                    <td style={{ color: '#94a3b8' }}>{c.country}</td>
                    <td style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {c.last_crawled_at
                        ? formatDistanceToNow(new Date(c.last_crawled_at), { addSuffix: true })
                        : <span style={{ color: '#475569' }}>Never</span>}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                        disabled={triggering === c.id}
                        onClick={(e) => handleTrigger(c.id, e)}
                      >
                        {triggering === c.id ? '⏳' : '▶ Run Report'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
