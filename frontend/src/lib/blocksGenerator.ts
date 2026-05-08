import { Landing, Block } from '../types'

// Helper function to clean block props
function cleanBlockProps(props: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value
    }
  }
  return cleaned
}

// Helper function to validate block
function isBlockValid(block: Block): boolean {
  return !!(block.type && block.id && block.props)
}

// Generate blocks content for VTEX (correct structure according to VTEX documentation)
export function generateBlocksContent(landing: Landing, templateKey: string): Record<string, any> {
  // Use the provided template key for unique blocks per landing
  const actualTemplateKey = templateKey;
  const blocks = typeof landing.blocks === 'string' ? JSON.parse(landing.blocks) : landing.blocks
  
  const validBlocks = blocks.filter(isBlockValid)
  
  // Create blocks array for the main store template
  const storeBlocks: string[] = []
  
  const blocksContent: Record<string, any> = {}
  
  // Add each block definition following VTEX structure
  validBlocks.forEach((block: Block, index: number) => {
    const cleanedProps = cleanBlockProps(block.props)
    const blockNumber = index + 1
    
    if (block.type === 'product-summary.shelf') {
      // Product list block
      const productListKey = `list-context.product-list#landing-${landing.id}-carousel-${blockNumber}`
      const sliderKey = `slider-layout#landing-${landing.id}-carousel-${blockNumber}`
      
      // Add to store blocks array (only the slider, not the product list)
      storeBlocks.push(sliderKey)
      
      // Product list definition
      blocksContent[productListKey] = {
        props: {
          collection: cleanedProps.collection || "158",
          maxItems: cleanedProps.maxItems || 8,
          titleText: cleanedProps.titleText || 'Productos Destacados',
          hideOutOfStockItems: cleanedProps.hideOutOfStockItems !== false,
          orderBy: cleanedProps.orderBy || "OrderByTopSaleDESC"
        },
        blocks: ["product-summary.shelf"],
        children: [sliderKey]
      }
      
      // Slider layout definition
      blocksContent[sliderKey] = {
        props: {
          itemsPerPage: {
            desktop: cleanedProps.itemsPerPage?.desktop || 4,
            tablet: cleanedProps.itemsPerPage?.tablet || 3,
            phone: cleanedProps.itemsPerPage?.phone || 1
          },
          infinite: cleanedProps.infinite !== false,
          showNavigationArrows: cleanedProps.showNavigationArrows || "desktopOnly",
          showPaginationDots: cleanedProps.showPaginationDots || "mobileOnly",
          fullWidth: cleanedProps.fullWidth || false,
          blockClass: cleanedProps.blockClass || "shelf"
        }
      }
      
    } else if (block.type === 'image') {
      // Image block
      const imageKey = `image#landing-${landing.id}-banner-${blockNumber}`
      storeBlocks.push(imageKey)
      
      blocksContent[imageKey] = {
        props: {
          src: cleanedProps.src || '',
          alt: cleanedProps.alt || '',
          maxHeight: cleanedProps.maxHeight || 300
        }
      }
      
    } else if (block.type === 'rich-text') {
      // Rich text block
      const textKey = `rich-text#landing-${landing.id}-intro-${blockNumber}`
      storeBlocks.push(textKey)
      
      blocksContent[textKey] = {
        props: {
          text: cleanedProps.text || `## ${landing.name}\n\n${landing.description || 'Bienvenido a nuestra landing page'}`,
          textAlignment: cleanedProps.textAlignment || "LEFT",
          textColor: cleanedProps.textColor || "#000000",
          fontSize: cleanedProps.fontSize || "16px"
        }
      }
      
    } else {
      // Default block handling
      const blockKey = `${block.type}#landing-${landing.id}-${block.type}-${blockNumber}`
      storeBlocks.push(blockKey)
      
      blocksContent[blockKey] = {
        props: cleanedProps
      }
    }
  })
  
  // Create final blocksContent with main block first
  const finalBlocksContent: Record<string, any> = {}
  
  // Add main store block FIRST (VTEX requirement)
  finalBlocksContent[`store.custom#${actualTemplateKey}`] = {
    blocks: storeBlocks
  }
  
  // Add all other block definitions
  Object.assign(finalBlocksContent, blocksContent)
  
  // No additional fallback needed since we're using 'landing' directly
  
  return finalBlocksContent
}
