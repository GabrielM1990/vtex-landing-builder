import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ExternalLink, Trash2, Edit, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { landingsApi } from '../lib/api'
import { Landing } from '../types'

export default function Dashboard() {
  const [landings, setLandings] = useState<Landing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLandings()
  }, [])

  const loadLandings = async () => {
    try {
      const data = await landingsApi.getAll()
      setLandings(data)
    } catch (error) {
      toast.error('Error al cargar las landings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta landing?')) return
    
    try {
      await landingsApi.delete(id)
      toast.success('Landing eliminada')
      loadLandings()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vtex-pink"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Landing Pages</h2>
          <p className="text-gray-500 mt-1">
            {landings.length} {landings.length === 1 ? 'landing creada' : 'landings creadas'}
          </p>
        </div>
        
        <Link
          to="/landing/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Crear Nueva Landing</span>
        </Link>
      </div>

      {/* Landings Grid */}
      {landings.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay landings aún
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Crea tu primera landing page para empezar a personalizar tu tienda VTEX
          </p>
          <Link to="/landing/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} />
            Crear Landing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landings.map((landing) => (
            <div key={landing.id} className="card group hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {landing.status === 'deployed' ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle size={16} />
                      Publicada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                      <Clock size={16} />
                      Borrador
                    </span>
                  )}
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/landing/${landing.id}`}
                    className="p-1.5 text-gray-500 hover:text-vtex-pink hover:bg-gray-100 rounded"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(landing.id)}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <Link to={`/landing/${landing.id}`} className="block">
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-vtex-pink transition-colors">
                  {landing.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  /{landing.route}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {landing.blocks.length} {landing.blocks.length === 1 ? 'bloque' : 'bloques'}
                  </span>
                  <span>Actualizado: {formatDate(landing.updatedAt)}</span>
                </div>
              </Link>

              {/* Card Footer */}
              {landing.status === 'deployed' && landing.deployedAt && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={`https://${import.meta.env.VITE_VTEX_ACCOUNT || 'tiendauno'}.myvtex.com/${landing.route}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-vtex-pink hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={14} />
                    Ver en vivo
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
