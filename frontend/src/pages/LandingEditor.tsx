import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLandingStore } from '../store/landingStore'
import { landingsApi, githubApi } from '../lib/api'
import { Landing } from '../types'
import ComponentPanel from '../components/ComponentPanel'
import Canvas from '../components/Canvas'
import PropertyPanel from '../components/PropertyPanel'
import PageSettings from '../components/PageSettings'
import { DirectDeployPanel } from '../components/DirectDeployPanel'
import JsonPreview from '../components/JsonPreview'

export default function LandingEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'components' | 'settings'>('components')
  const [workspace, setWorkspace] = useState<'master' | 'customlanding'>('customlanding') // Default to test workspace
  
  const { 
    currentLanding, 
    setCurrentLanding, 
    resetLanding
  } = useLandingStore()

  useEffect(() => {
    if (id) {
      loadLanding(id)
    } else {
      resetLanding()
    }
    
    return () => {
      resetLanding()
    }
  }, [id])

  const loadLanding = async (landingId: string) => {
    try {
      const landing = await landingsApi.getById(landingId)
      setCurrentLanding(landing)
    } catch (error) {
      toast.error('Error al cargar la landing')
      navigate('/')
    }
  }

  const handleSave = async () => {
    if (!currentLanding.name || !currentLanding.route) {
      toast.error('Completa el nombre y la ruta de la landing')
      return
    }

    setIsSaving(true)
    try {
      if (id) {
        await landingsApi.update(id, currentLanding)
      } else {
        const created = await landingsApi.create(currentLanding as any)
        setCurrentLanding(created)
        navigate(`/landing/${created.id}`, { replace: true })
      }
      toast.success('Guardado exitosamente')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // Comprehensive validation before deploy
  const validateForDeploy = () => {
    const blocks = currentLanding.blocks || []
    const errors: string[] = []
    const warnings: string[] = []
    
    if (blocks.length === 0) {
      errors.push('La landing debe tener al menos un bloque')
      return { valid: false, errors, warnings }
    }
    
    blocks.forEach((block, index) => {
      const props = block.props || {}
      
      switch (block.type) {
        case 'rich-text':
          const text = props.text && props.text.trim()
          if (!text || text === 'Escribe tu texto aquí') {
            errors.push(`Bloque ${index + 1} (Texto): Debe tener contenido personalizado`)
          } else if (text.length < 10) {
            warnings.push(`Bloque ${index + 1} (Texto): El texto es muy corto`)
          }
          break
          
        case 'image':
          if (!props.src || props.src.trim() === '') {
            errors.push(`Bloque ${index + 1} (Imagen): Debe tener una URL de imagen válida`)
          }
          break
          
        case 'info-card':
          const headline = props.headline && props.headline.trim()
          const ctaText = props.callToActionText && props.callToActionText.trim()
          if (!headline || headline === 'Título Principal') {
            errors.push(`Bloque ${index + 1} (Info Card): Debe tener un título personalizado`)
          }
          if (!ctaText || ctaText === 'Ver Más') {
            errors.push(`Bloque ${index + 1} (Info Card): Debe tener un texto de botón personalizado`)
          }
          break
          
        case 'list-context.product-list':
          if (!props.collection || props.collection <= 0) {
            errors.push(`Bloque ${index + 1} (Productos): Debe seleccionar una colección válida`)
          }
          break
          
        case 'flex-layout.row':
        case 'flex-layout.col':
          const hasCustomStyling = props.backgroundColor !== '#f8f9fa' || 
                                 props.paddingTop !== 24 || 
                                 props.paddingBottom !== 24
          if (!hasCustomStyling) {
            warnings.push(`Bloque ${index + 1} (Layout): No tiene estilos personalizados`)
          }
          break
          
        default:
          if (Object.keys(props).length === 0) {
            warnings.push(`Bloque ${index + 1} (${block.type}): No tiene propiedades configuradas`)
          }
      }
    })
    
    return { 
      valid: errors.length === 0, 
      errors, 
      warnings 
    }
  }

  const handleAIAnalysis = async () => {
    if (!id) {
      toast.error('Primero guarda la landing')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await githubApi.analyzeWithAI(currentLanding as Landing)
      console.log('AI Analysis result:', result)
      
      // Show analysis results
      const analysis = (result as any).data?.analysis || (result as any).analysis || {}
      
      let message = '🤖 Análisis IA completado:\n\n'
      
      // Repository info
      if (analysis.repository) {
        message += `📁 Repositorio: ${analysis.repository.name}\n`
        message += `🌿 Rama: ${analysis.repository.defaultBranch}\n\n`
      }
      
      // Recommendations
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        message += '💡 Recomendaciones:\n'
        analysis.recommendations.forEach((rec: any) => {
          message += `• ${rec.message}\n`
        })
        message += '\n'
      }
      
      // Files to generate
      const fileCount = Object.keys(analysis.filesToGenerate || {}).length
      message += `📄 Archivos a generar: ${fileCount}\n`
      
      // Warnings
      if (analysis.warnings && analysis.warnings.length > 0) {
        message += '\n⚠️ Advertencias:\n'
        analysis.warnings.forEach((warning: any) => {
          message += `• ${warning.message}\n`
        })
      }
      
      toast.success(message)
      
      // Ask if user wants to proceed with deploy
      const proceedDeploy = window.confirm(
        '¿Deseas proceder con el deploy basado en el análisis IA?'
      )
      if (proceedDeploy) {
        handleIntelligentDeploy()
      }
      
    } catch (error: any) {
      console.error('AI Analysis error:', error)
      toast.error(`❌ Error en análisis IA: ${error.response?.data?.error || error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleIntelligentDeploy = async () => {
    if (!id) {
      toast.error('Primero guarda la landing')
      return
    }

    // Comprehensive validation
    const validation = validateForDeploy()
    
    if (!validation.valid) {
      toast.error(`No se puede deployar:\n${validation.errors.join('\n')}`)
      return
    }
    
    if (validation.warnings.length > 0) {
      const proceed = window.confirm(
        `Advertencias:\n${validation.warnings.join('\n')}\n\n¿Deseas continuar con el deploy?`
      )
      if (!proceed) return
    }

    setIsDeploying(true)
    const toastId = toast.loading('🚀 Iniciando deploy automático...')
    
    try {
      // Show preview before deploy
      const proceedDeploy = window.confirm(
        '🚀 ¿Estás seguro de hacer deploy inteligente a VTEX?\n\n' +
        'Este proceso automático:\n' +
        '1. Consultará tu repositorio GitHub\n' +
        '2. Creará/modificará archivos necesarios\n' +
        '3. Hará commit automático\n' +
        '4. VTEX hará deploy automático\n\n' +
        '¿Continuar?'
      )
      if (!proceedDeploy) {
        toast.dismiss(toastId)
        setIsDeploying(false)
        return
      }
      
      toast.loading(`📥 Consultando repositorio para workspace ${workspace}...`, { id: toastId })
      console.log('🚀 Deploying landing data:', JSON.stringify(currentLanding, null, 2))
      const result = await githubApi.deploy(id!, currentLanding as Landing, workspace)
      
      // Show detailed results
      const { summary, filesUpdated } = result.data || result
      
      const deployedWorkspace = result.data?.workspace || workspace
      
      let message = `✅ Deploy completado a workspace: ${deployedWorkspace}!\n\n`
      message += `🎯 Workspace: ${deployedWorkspace}\n`
      message += `📊 Resumen:\n`
      message += `• Pasos completados: ${summary?.successfulSteps || 6}/6\n`
      message += `• Archivos modificados: ${Object.keys(filesUpdated || {}).length}\n\n`
      
      if (filesUpdated?.routes) {
        message += `📝 ${filesUpdated.routes}\n`
      }
      if (filesUpdated?.blocks) {
        message += `📦 ${filesUpdated.blocks}\n`
      }
      
      message += `\n🌐 URL: https://${deployedWorkspace}--tiendauno.myvtex.com${currentLanding.route || ''}`
      
      toast.success(message, { id: toastId, duration: 5000 })
      console.log('Deploy result:', result)
    } catch (error: any) {
      console.error('Deploy error:', error)
      const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message
      toast.error(`❌ Error: ${errorMsg}`, { id: toastId })
    } finally {
      setIsDeploying(false)
    }
  }

  const handleDeploy = async () => {
    if (!id) {
      toast.error('Primero guarda la landing')
      return
    }

    // Comprehensive validation
    const validation = validateForDeploy()
    
    if (!validation.valid) {
      toast.error(`No se puede deployar:\n${validation.errors.join('\n')}`)
      return
    }
    
    if (validation.warnings.length > 0) {
      const proceed = window.confirm(
        `Advertencias:\n${validation.warnings.join('\n')}\n\n¿Deseas continuar con el deploy?`
      )
      if (!proceed) return
    }

    setIsDeploying(true)
    try {
      // Show preview before deploy
      const proceedDeploy = window.confirm(
        '¿Estás seguro de hacer deploy a VTEX? Esto actualizará tu store-theme con los bloques actuales.'
      )
      if (!proceedDeploy) return
      
      const result = await githubApi.deploy(id!, currentLanding as Landing)
      toast.success('✅ Desplegado exitosamente a VTEX')
      console.log('Deploy result:', result)
    } catch (error: any) {
      console.error('Deploy error:', error)
      toast.error(`❌ Error al desplegar: ${error.response?.data?.error || error.message}`)
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Nombre de la landing"
            value={currentLanding.name || ''}
            onChange={(e) => useLandingStore.getState().updateLandingField('name', e.target.value)}
            className="input w-64 font-medium"
          />
          <div className="flex items-center gap-2 text-gray-500">
            <span>/</span>
            <input
              type="text"
              placeholder="ruta-de-la-landing"
              value={currentLanding.route || ''}
              onChange={(e) => useLandingStore.getState().updateLandingField('route', e.target.value)}
              className="input w-48"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Workspace Selector */}
          <div className="flex items-center gap-2 mr-2">
            <label className="text-sm text-gray-600">Workspace:</label>
            <select
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value as 'master' | 'customlanding')}
              disabled={isSaving || isDeploying || isAnalyzing}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="customlanding">🧪 customlanding (pruebas)</option>
              <option value="master">🚀 master (producción)</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || isDeploying || isAnalyzing}
            className="btn-secondary"
          >
            {isSaving ? 'Guardando...' : 'Guardar Borrador'}
          </button>
          
          <button
            onClick={handleAIAnalysis}
            disabled={isSaving || isDeploying || isAnalyzing || !id}
            className="btn-purple"
          >
            {isAnalyzing ? '🤖 Analizando...' : '🤖 Análisis IA'}
          </button>
          
          <button
            onClick={handleDeploy}
            disabled={isSaving || isDeploying || isAnalyzing || !id}
            className="btn-primary"
          >
            {isDeploying ? `Deploying to ${workspace}...` : `Deploy to ${workspace}`}
          </button>
        </div>
      </div>

      {/* Direct Deploy Panel - Only show when landing is saved */}
      {id && currentLanding.name && (
        <DirectDeployPanel
          landingId={id}
          landingName={currentLanding.name}
          route={currentLanding.route || ''}
        />
      )}

      {/* JSON Preview Panel */}
      <JsonPreview />

      {/* Editor Layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel - Component Palette */}
        <div className="w-64 flex flex-col">
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('components')}
              className={`flex-1 pb-2 text-sm font-medium ${
                activeTab === 'components' 
                  ? 'text-vtex-pink border-b-2 border-vtex-pink' 
                  : 'text-gray-500'
              }`}
            >
              Componentes
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 pb-2 text-sm font-medium ${
                activeTab === 'settings' 
                  ? 'text-vtex-pink border-b-2 border-vtex-pink' 
                  : 'text-gray-500'
              }`}
            >
              Configuración
            </button>
          </div>
          
          {activeTab === 'components' ? <ComponentPanel /> : <PageSettings />}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1">
          <Canvas />
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72">
          <PropertyPanel />
        </div>
      </div>
    </div>
  )
}
