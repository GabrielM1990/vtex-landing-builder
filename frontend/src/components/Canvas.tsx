import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, Trash2, Plus } from 'lucide-react'
import { useLandingStore } from '../store/landingStore'
import { getComponentByType } from '../lib/components'
import { Block, ComponentDefinition } from '../types'
import { v4 as uuidv4 } from '../lib/uuid'

export default function Canvas() {
  const { currentLanding, addBlock, reorderBlocks, removeBlock, setSelectedBlockId, selectedBlockId } = useLandingStore()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    
    reorderBlocks(result.source.index, result.destination.index)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const data = e.dataTransfer.getData('application/json')
    if (!data) return
    
    const component: ComponentDefinition = JSON.parse(data)
    
    const newBlock: Block = {
      id: uuidv4(),
      type: component.type,
      props: { ...component.defaultProps },
    }
    
    addBlock(newBlock)
    setSelectedBlockId(newBlock.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`h-full bg-gray-100 rounded-xl border-2 border-dashed transition-all overflow-hidden flex flex-col ${
        isDragOver ? 'border-vtex-pink bg-vtex-pink bg-opacity-5' : 'border-gray-300'
      }`}
    >
      {/* Mobile Preview Frame */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto bg-white min-h-full rounded-lg shadow-sm">
          {/* Page Header Simulation */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="w-32 h-6 bg-gray-200 rounded"></div>
            <div className="flex gap-4">
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Canvas Content */}
          <div className="p-6 min-h-[400px]">
            {(currentLanding.blocks || []).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                <Plus size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Arrastra componentes aquí</p>
                <p className="text-sm">Usa el panel izquierdo para agregar bloques</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="canvas">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-4"
                    >
                      {(currentLanding.blocks || []).map((block, index) => (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group relative rounded-lg border-2 transition-all ${
                                selectedBlockId === block.id
                                  ? 'border-vtex-pink shadow-md'
                                  : 'border-gray-200 hover:border-gray-300'
                              } ${snapshot.isDragging ? 'opacity-50 shadow-lg' : ''}`}
                              onClick={() => setSelectedBlockId(block.id)}
                            >
                              {/* Block Header */}
                              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-t-lg border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
                                  >
                                    <GripVertical size={16} className="text-gray-400" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">
                                    {getComponentByType(block.type)?.name || block.type}
                                  </span>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeBlock(block.id)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {/* Block Preview */}
                              <div className="p-4">
                                <BlockPreview block={block} />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BlockPreview({ block }: { block: Block }) {
  const component = getComponentByType(block.type)
  
  switch (block.type) {
    case 'rich-text':
      return (
        <div 
          className="prose max-w-none"
          style={{ 
            textAlign: block.props.textAlignment?.toLowerCase() || 'left',
            color: block.props.textColor || '#000000'
          }}
        >
          {block.props.text || 'Texto vacío'}
        </div>
      )
      
    case 'image':
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
          {block.props.src ? (
            <img 
              src={block.props.src} 
              alt={block.props.alt || ''}
              className="max-w-full h-auto"
              style={{ maxHeight: block.props.maxHeight || 300 }}
            />
          ) : (
            <div className="py-12 text-gray-400 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mb-2"></div>
              <span className="text-sm">Sin imagen</span>
            </div>
          )}
        </div>
      )
      
    case 'product-summary.shelf':
      return (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-4">
            {block.props.titleText || 'Vitrina de Productos'}
          </h4>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-lg"></div>
            ))}
          </div>
          {block.props.collection && (
            <p className="text-xs text-gray-500 mt-2">
              Colección ID: {block.props.collection}
            </p>
          )}
        </div>
      )
      
    case 'flex-layout.row':
      return (
        <div 
          className="flex gap-4 min-h-[80px] rounded-lg border-2 border-dashed border-gray-300"
          style={{ 
            backgroundColor: block.props.backgroundColor || '#ffffff',
            padding: `${block.props.paddingTop || 16}px ${block.props.paddingRight || 16}px ${block.props.paddingBottom || 16}px ${block.props.paddingLeft || 16}px`
          }}
        >
          <div className="flex-1 bg-gray-100 rounded min-h-[40px] flex items-center justify-center text-gray-400 text-sm">
            Fila - {block.children?.length || 0} elementos
          </div>
        </div>
      )
      
    case 'slider-layout':
      return (
        <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-sm font-medium">Carrusel de Banners</div>
            <div className="text-xs">
              {block.props.items?.length || 0} slides
            </div>
          </div>
        </div>
      )
      
    case 'info-card':
      return (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            {block.props.imageUrl ? (
              <img 
                src={block.props.imageUrl} 
                alt="" 
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 mb-2">
                {block.props.headline || 'Tarjeta de Información'}
              </h4>
              <button className="px-3 py-1 bg-vtex-pink text-white text-sm rounded">
                {block.props.callToActionText || 'Ver Más'}
              </button>
            </div>
          </div>
        </div>
      )
      
    case 'list-context.product-list':
      return (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-4">
            Lista de Productos ({block.props.maxItems || 10} items)
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      )
      
    case 'list-context.image-list':
      return (
        <div className="bg-gray-100 rounded-lg flex items-center justify-center" 
             style={{ height: block.props.height || 570 }}>
          <div className="text-center text-gray-400">
            <div className="text-sm font-medium">Lista de Imágenes</div>
            <div className="text-xs">
              {block.props.images?.length || 0} imágenes
            </div>
          </div>
        </div>
      )
      
    default:
      return (
        <div className="py-8 text-center text-gray-400">
          <div className="text-sm font-medium">{component?.name || block.type}</div>
          <div className="text-xs mt-1">Vista previa no disponible</div>
        </div>
      )
  }
}
