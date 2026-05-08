import { create } from 'zustand'
import { Landing, Block } from '../types'

interface LandingState {
  // Current landing being edited
  currentLanding: Partial<Landing>
  selectedBlockId: string | null
  
  // Actions
  setCurrentLanding: (landing: Partial<Landing>) => void
  updateLandingField: (field: keyof Landing, value: any) => void
  addBlock: (block: Block) => void
  updateBlock: (blockId: string, updates: Partial<Block>) => void
  removeBlock: (blockId: string) => void
  reorderBlocks: (startIndex: number, endIndex: number) => void
  setSelectedBlockId: (id: string | null) => void
  resetLanding: () => void
}

const defaultLanding: Partial<Landing> = {
  name: '',
  route: '',
  blocks: [],
  status: 'draft',
}

export const useLandingStore = create<LandingState>((set) => ({
  currentLanding: { ...defaultLanding },
  selectedBlockId: null,

  setCurrentLanding: (landing) => set({ currentLanding: landing }),
  
  updateLandingField: (field, value) => 
    set((state) => ({
      currentLanding: { ...state.currentLanding, [field]: value }
    })),
  
  addBlock: (block) =>
    set((state) => ({
      currentLanding: {
        ...state.currentLanding,
        blocks: [...(state.currentLanding.blocks || []), block]
      }
    })),
  
  updateBlock: (blockId, updates) =>
    set((state) => ({
      currentLanding: {
        ...state.currentLanding,
        blocks: state.currentLanding.blocks?.map((b) =>
          b.id === blockId ? { ...b, ...updates } : b
        ) || []
      }
    })),
  
  removeBlock: (blockId) =>
    set((state) => ({
      currentLanding: {
        ...state.currentLanding,
        blocks: state.currentLanding.blocks?.filter((b) => b.id !== blockId) || []
      },
      selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId
    })),
  
  reorderBlocks: (startIndex, endIndex) =>
    set((state) => {
      const blocks = [...(state.currentLanding.blocks || [])]
      const [removed] = blocks.splice(startIndex, 1)
      blocks.splice(endIndex, 0, removed)
      return {
        currentLanding: { ...state.currentLanding, blocks }
      }
    }),
  
  setSelectedBlockId: (id) => set({ selectedBlockId: id }),
  
  resetLanding: () => set({ currentLanding: { ...defaultLanding }, selectedBlockId: null }),
}))
