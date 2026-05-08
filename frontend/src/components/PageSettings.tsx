import { useLandingStore } from '../store/landingStore'
import { Globe, Smartphone, Monitor } from 'lucide-react'

export default function PageSettings() {
  const { currentLanding, updateLandingField } = useLandingStore()

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {/* Basic Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Configuración Básica
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre interno
            </label>
            <input
              type="text"
              value={currentLanding.name || ''}
              onChange={(e) => updateLandingField('name', e.target.value)}
              className="input"
              placeholder="Ej: Ofertas Black Friday"
            />
            <p className="text-xs text-gray-500 mt-1">
              Solo para uso interno, no se muestra públicamente
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de la página
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-2">/</span>
              <input
                type="text"
                value={currentLanding.route || ''}
                onChange={(e) => updateLandingField('route', e.target.value)}
                className="input"
                placeholder="ofertas-black-friday"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              La landing será accesible en: tu-tienda.com/{currentLanding.route || '[ruta]'}
            </p>
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          SEO
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title
            </label>
            <input
              type="text"
              className="input"
              placeholder="Título para SEO (opcional)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              rows={3}
              className="input"
              placeholder="Descripción para SEO (opcional)"
            />
          </div>
        </div>
      </div>

      {/* Responsive Preview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Vista Previa Responsive
        </h3>
        
        <div className="flex gap-2">
          <button className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-vtex-pink hover:bg-vtex-pink hover:bg-opacity-5 transition-all">
            <Monitor size={20} className="text-gray-600" />
            <span className="text-xs text-gray-600">Desktop</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-vtex-pink hover:bg-vtex-pink hover:bg-opacity-5 transition-all">
            <Globe size={20} className="text-gray-600" />
            <span className="text-xs text-gray-600">Tablet</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-vtex-pink hover:bg-vtex-pink hover:bg-opacity-5 transition-all">
            <Smartphone size={20} className="text-gray-600" />
            <span className="text-xs text-gray-600">Mobile</span>
          </button>
        </div>
      </div>

      {/* Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-1">
          Tips para la ruta URL
        </h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Usa solo letras minúsculas, números y guiones</li>
          <li>No uses espacios ni caracteres especiales</li>
          <li>Mantén la URL corta y descriptiva</li>
          <li>Evita rutas que ya existan en tu tienda</li>
        </ul>
      </div>
    </div>
  )
}
