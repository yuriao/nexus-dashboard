import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:80'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('nexus_access')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('nexus_refresh')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/api/auth/refresh/`, { refresh })
          localStorage.setItem('nexus_access', data.access)
          err.config.headers.Authorization = `Bearer ${data.access}`
          return api.request(err.config)
        } catch {
          localStorage.removeItem('nexus_access')
          localStorage.removeItem('nexus_refresh')
          window.location.href = '/nexus-dashboard/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post('/api/auth/login/', { username, password })

export const register = (username: string, email: string, password: string) =>
  api.post('/api/auth/register/', { username, email, password })

// ── Companies ────────────────────────────────────────────────────────────────
export const getCompanies = (search = '') =>
  api.get('/api/companies/', { params: search ? { search } : {} })

export const createCompany = (data: object) => api.post('/api/companies/', data)

export const getCompany = (id: number) => api.get(`/api/companies/${id}/`)

export const addToWatchlist = (companyId: number) =>
  api.post(`/api/companies/${companyId}/watchlist/`)

export const removeFromWatchlist = (companyId: number) =>
  api.delete(`/api/companies/${companyId}/watchlist/`)

// ── Reports ──────────────────────────────────────────────────────────────────
export const triggerReport = (companyId: number) =>
  api.post('/api/reports/trigger/', { company_id: companyId })

export const getReport = (id: string) => api.get(`/api/reports/${id}/`)

export const getReportStatus = (id: string) => api.get(`/api/reports/${id}/status/`)

export const listReports = (page = 1) =>
  api.get('/api/reports/', { params: { page } })

// ── Data points ──────────────────────────────────────────────────────────────
export const getDataPoints = (companyId: number, sourceType?: string) =>
  api.get('/api/datapoints/', {
    params: { company: companyId, ...(sourceType ? { source_type: sourceType } : {}) },
  })
