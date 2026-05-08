import { useState, useEffect } from 'react'
import { useLandingStore } from '../store/landingStore'
import { getComponentByType } from '../lib/components'
import { vtexApi } from '../lib/api'
import { Collection, EditableProp } from '../types'

export default function PropertyPanel() {
  const { currentLanding, selectedBlockId, updateBlock } = useLandingStore()
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionSearch, setCollectionSearch] = useState('')

  const selectedBlock = currentLanding.blocks?.find(b => b.id === selectedBlockId)
  const component = selectedBlock ? getComponentByType(selectedBlock.type) : null

  useEffect(() => {
    // Load collections if needed
    const hasCollectionField = component?.editableProps.some(p => p.type === 'collection')
    if (hasCollectionField) {
      loadCollections()
    }
  }, [component])

  const loadCollections = async () => {
    try {
      const data = await vtexApi.getCollections()
      setCollections(data)
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }

  const handlePropChange = (propName: string, value: any) => {
    if (!selectedBlock) return
    updateBlock(selectedBlock.id, {
      ...selectedBlock,
      props: {
        ...selectedBlock.props,
        [propName]: value
      }
    })
  }

  // Check if block has validation errors
  const getValidationErrors = () => {
    if (!selectedBlock || !component) return []
    
    const errors: string[] = []
    const props = selectedBlock.props || {}
    
    component.editableProps.forEach(prop => {
      if (prop.required && (!props[prop.name] || props[prop.name] === '')) {
        errors.push(`${prop.label} es requerido`)
      }
    })
    
    // Special validations for certain block types
    switch (selectedBlock.type) {
      case 'rich-text':
        if (!props.text || props.text.trim() === '') {
          errors.push('El texto es requerido')
        }
        break
      case 'image':
        if (!props.src || props.src.trim() === '') {
          errors.push('La URL de la imagen es requerida')
        }
        break
      case 'info-card':
        if (!props.headline || props.headline.trim() === '') {
          errors.push('El título es requerido')
        }
        if (!props.callToActionText || props.callToActionText.trim() === '') {
          errors.push('El texto del botón es requerido')
        }
        break
    }
    
    return errors
  }

  const validationErrors = getValidationErrors()

  const renderField = (prop: EditableProp) => {
    if (!selectedBlock) return null
    
    const value = selectedBlock.props[prop.name]
    
    switch (prop.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            className="input"
          />
        )
        
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            rows={4}
            className="input"
          />
        )
        
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handlePropChange(prop.name, parseInt(e.target.value) || 0)}
            className="input"
          />
        )
        
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            className="input"
          >
            {(prop.options || []).map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
        
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handlePropChange(prop.name, e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handlePropChange(prop.name, e.target.value)}
              className="input flex-1"
              placeholder="#000000"
            />
          </div>
        )
        
      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handlePropChange(prop.name, e.target.value)}
              className="input"
              placeholder="https://..."
            />
            {value && (
              <img 
                src={value} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded-lg"
              />
            )}
          </div>
        )
        
      case 'collection':
        const filtered = (collections || []).filter(c => 
          (c.name || '').toLowerCase().includes((collectionSearch || '').toLowerCase())
        )
        
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              placeholder="Buscar colección..."
              className="input"
            />
            <select
              value={value || ''}
              onChange={(e) => {
                const val = e.target.value
                const numVal = val ? parseInt(val) : null
                console.log('🎨 Collection selected:', val, '→', numVal)
                handlePropChange(prop.name, numVal)
              }}
              className="input"
            >
              <option value="">Seleccionar colección</option>
              {filtered.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (ID: {c.id})
                </option>
              ))}
            </select>
          </div>
        )
        
      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handlePropChange(prop.name, e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-vtex-pink focus:ring-vtex-pink"
            />
            <span className="text-sm text-gray-600">Activado</span>
          </label>
        )
        
      default:
        return null
    }
  }

  if (!selectedBlock) {
    return (
      <div className="card h-full">
        <div className="text-center text-gray-400 py-12">
          <p className="text-sm">Selecciona un bloque para editar sus propiedades</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card h-full overflow-y-auto">
      <h3 className="font-semibold text-gray-900 mb-4">
        {component?.name}
      </h3>
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">Errores de validación:</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="space-y-4">
        {component?.editableProps.map((prop) => (
          <div key={prop.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {prop.label}
              {prop.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(prop)}
          </div>
        ))}
      </div>
      
      {/* Advanced: Raw JSON */}
      <details className="mt-6">
        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
          Ver JSON avanzado
        </summary>
        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-48">
          {JSON.stringify(selectedBlock?.props || {}, null, 2)}
        </pre>
      </details>
    </div>
  )
}
