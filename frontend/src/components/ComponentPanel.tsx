import { Layout, Type, Image, ShoppingBag, ImagePlus, LayoutGrid } from 'lucide-react'
import { availableComponents } from '../lib/components'
import { ComponentDefinition } from '../types'

const categoryIcons: Record<string, any> = {
  layout: LayoutGrid,
  content: Type,
  products: ShoppingBag,
  media: ImagePlus,
}

const categoryLabels: Record<string, string> = {
  layout: 'Layout',
  content: 'Contenido',
  products: 'Productos',
  media: 'Medios',
}

export default function ComponentPanel() {
  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify(component))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const categories = ['layout', 'content', 'products', 'media']

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {categories.map((category) => {
        const components = availableComponents.filter(c => c.category === category)
        if (components.length === 0) return null
        
        const CategoryIcon = categoryIcons[category]
        
        return (
          <div key={category}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              <CategoryIcon size={16} />
              {categoryLabels[category]}
            </h3>
            
            <div className="space-y-2">
              {components.map((component) => (
                <div
                  key={component.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component)}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-vtex-pink hover:shadow-sm transition-all group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center group-hover:bg-vtex-pink group-hover:bg-opacity-10 transition-colors">
                    <IconForType type={component.type} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {component.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function IconForType({ type }: { type: string }) {
  switch (type) {
    case 'flex-layout.row':
      return <LayoutGrid size={16} className="text-gray-500 group-hover:text-vtex-pink" />
    case 'flex-layout.col':
      return <Layout size={16} className="text-gray-500 group-hover:text-vtex-pink" />
    case 'rich-text':
      return <Type size={16} className="text-gray-500 group-hover:text-vtex-pink" />
    case 'image':
      return <Image size={16} className="text-gray-500 group-hover:text-vtex-pink" />
    case 'product-summary.shelf':
    case 'list-context.product-list':
      return <ShoppingBag size={16} className="text-gray-500 group-hover:text-vtex-pink" />
    case 'slider-layout':
    case 'list-context.image-list':
      return <ImagePlus size={16} className="text-gray-500 group-hover:text-vtex-pink" />
    case 'info-card':
      return <Layout size={16} className="text-gray-500 group-hover:text-vtex-pink" />
    default:
      return <div className="w-4 h-4 bg-gray-300 rounded" />
  }
}
