export interface Block {
  id: string
  type: string
  props: Record<string, any>
  children?: string[] // IDs de bloques hijos para referencias VTEX
}

export interface Landing {
  id: string
  name: string
  route: string
  description?: string
  blocks: Block[]
  status: 'draft' | 'deployed'
  deployedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ComponentDefinition {
  type: string
  name: string
  icon: string
  category: 'layout' | 'content' | 'products' | 'media'
  defaultProps: Record<string, any>
  editableProps: EditableProp[]
}

export interface EditableProp {
  name: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'color' | 'image' | 'collection' | 'boolean'
  label: string
  options?: { value: string; label: string }[]
  required?: boolean
}

export interface Collection {
  id: number
  name: string
  type: string
}
