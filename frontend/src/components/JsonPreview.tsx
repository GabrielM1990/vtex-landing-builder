import { useState } from 'react'
import { useLandingStore } from '../store/landingStore'
import { Landing } from '../types'
import { generateBlocksContent } from '../lib/blocksGenerator.js'

export default function JsonPreview() {
  const { currentLanding } = useLandingStore()
  const [isOpen, setIsOpen] = useState(false)
  const [activeFile, setActiveFile] = useState<'blocks' | 'routes' | 'complete'>('blocks')

  if (!currentLanding.id) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">Guarda la landing para previsualizar el JSON</p>
      </div>
    )
  }

  const generateJsonPreview = () => {
    try {
      if (!currentLanding.id) {
        return { error: 'Landing ID is required' }
      }
      
      const templateKey = `landing-${currentLanding.id}`
      const blocksContent = generateBlocksContent(currentLanding as Landing, templateKey)
      
      // Estructura de archivos que se generarán
      return {
        files: {
          [`store/blocks/landing-${currentLanding.id}.json`]: blocksContent,
          [`store/routes.json`]: {
            [`store.custom#${currentLanding.id}`]: {
              path: currentLanding.route?.startsWith('/') ? currentLanding.route : `/${currentLanding.route}`
            }
          }
        },
        summary: {
          landingId: currentLanding.id,
          templateKey,
          route: currentLanding.route,
          blocksCount: Object.keys(blocksContent).length,
          mainBlock: `store.custom#${templateKey}`
        }
      }
    } catch (error) {
      return { error: (error as Error).message }
    }
  }

  const jsonPreview = generateJsonPreview()
  
  const getFileContent = () => {
    if (!jsonPreview.files) return ''
    
    switch (activeFile) {
      case 'blocks':
        return JSON.stringify(jsonPreview.files[`store/blocks/landing-${currentLanding.id}.json`], null, 2)
      case 'routes':
        return JSON.stringify(jsonPreview.files[`store/routes.json`], null, 2)
      case 'complete':
        return JSON.stringify(jsonPreview, null, 2)
      default:
        return ''
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">📄 Preview JSON</h3>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-sm text-vtex-pink hover:text-vtex-pink/80"
          >
            {isOpen ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          JSON generado para deploy a VTEX
        </p>
      </div>

      {isOpen && (
        <div className="p-4">
          {/* Summary Section */}
          {jsonPreview.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Resumen</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Landing ID:</strong> {jsonPreview.summary.landingId}</div>
                <div><strong>Template Key:</strong> {jsonPreview.summary.templateKey}</div>
                <div><strong>Ruta:</strong> {jsonPreview.summary.route}</div>
                <div><strong>Bloques:</strong> {jsonPreview.summary.blocksCount}</div>
                <div><strong>Bloque Principal:</strong> {jsonPreview.summary.mainBlock}</div>
              </div>
            </div>
          )}

          {/* Files Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveFile('blocks')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeFile === 'blocks' 
                    ? 'text-vtex-pink border-b-2 border-vtex-pink' 
                    : 'text-gray-500'
                }`}
              >
                📦 store/blocks/landing-{currentLanding.id}.json
              </button>
              <button
                onClick={() => setActiveFile('routes')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeFile === 'routes' 
                    ? 'text-vtex-pink border-b-2 border-vtex-pink' 
                    : 'text-gray-500'
                }`}
              >
                🛣️ store/routes.json
              </button>
              <button
                onClick={() => setActiveFile('complete')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeFile === 'complete' 
                    ? 'text-vtex-pink border-b-2 border-vtex-pink' 
                    : 'text-gray-500'
                }`}
              >
                📄 Vista Completa
              </button>
            </div>
          </div>

          {/* File Content */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre">
              {getFileContent()}
            </pre>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(getFileContent())
                alert('JSON copiado al portapapeles')
              }}
              className="px-3 py-1 bg-vtex-pink text-white text-sm rounded hover:bg-vtex-pink/80"
            >
              📋 Copiar JSON Actual
            </button>
            
            <button
              onClick={() => {
                const blob = new Blob([getFileContent()], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = activeFile === 'routes' ? 'routes.json' : `landing-${currentLanding.id}.json`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              💾 Descargar Archivo Actual
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
