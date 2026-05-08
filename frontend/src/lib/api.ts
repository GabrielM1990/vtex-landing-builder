import axios from 'axios'
import { Landing, Collection } from '../types'

const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:3001/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Landings API
export const landingsApi = {
  getAll: () => api.get<Landing[]>('/landings').then(r => r.data),
  
  getById: (id: string) => api.get<Landing>(`/landings/${id}`).then(r => r.data),
  
  create: (landing: Partial<Landing>) => 
    api.post<Landing>('/landings', landing).then(r => r.data),
  
  update: (id: string, landing: Partial<Landing>) => 
    api.put<Landing>(`/landings/${id}`, landing).then(r => r.data),
  
  delete: (id: string) => api.delete(`/landings/${id}`),
  
  deploy: (id: string) => 
    api.post(`/landings/${id}/deploy`).then(r => r.data),
}

// VTEX API
export const vtexApi = {
  getCollections: (search?: string) => 
    api.get<Collection[]>('/vtex/collections', { params: { search } }).then(r => r.data),
}

// GitHub API
export const githubApi = {
  deploy: async (landingId: string, landing: Landing, workspace: string = 'master') => {
    return await api.post(`/github/deploy/${landingId}`, { landing, workspace })
  },
  
  analyzeWithAI: async (landing: Landing) => {
    return await api.post('/github/ai-analyze', { landing })
  },
  
  validate: (blocks: any[]) => 
    api.post('/github/validate', { blocks }).then(r => r.data),
}

export default api
