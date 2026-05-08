import { ComponentDefinition } from '../types'

export const availableComponents: ComponentDefinition[] = [
  // Layout
  {
    type: 'flex-layout.row',
    name: 'Fila (Row)',
    icon: 'Layout',
    category: 'layout',
    defaultProps: {
      backgroundColor: '#f8f9fa',
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24,
    },
    editableProps: [
      { name: 'backgroundColor', type: 'color', label: 'Color de fondo' },
      { name: 'paddingTop', type: 'number', label: 'Padding superior' },
      { name: 'paddingBottom', type: 'number', label: 'Padding inferior' },
    ],
  },
  {
    type: 'flex-layout.col',
    name: 'Columna (Col)',
    icon: 'LayoutGrid',
    category: 'layout',
    defaultProps: {
      width: '100%',
      padding: 16,
    },
    editableProps: [
      { name: 'width', type: 'text', label: 'Ancho' },
      { name: 'padding', type: 'number', label: 'Padding' },
    ],
  },
  
  // Content
  {
    type: 'rich-text',
    name: 'Texto Enriquecido',
    icon: 'Type',
    category: 'content',
    defaultProps: {
      text: '## Bienvenido a nuestra tienda\n\nDescubre nuestros productos destacados y las mejores ofertas.',
      textAlignment: 'LEFT',
      textColor: '#000000',
      fontSize: '16px',
    },
    editableProps: [
      { 
        name: 'text', 
        type: 'textarea', 
        label: 'Contenido',
        required: true 
      },
      { 
        name: 'textAlignment', 
        type: 'select', 
        label: 'Alineación',
        options: [
          { value: 'LEFT', label: 'Izquierda' },
          { value: 'CENTER', label: 'Centro' },
          { value: 'RIGHT', label: 'Derecha' },
        ]
      },
      { name: 'textColor', type: 'color', label: 'Color de texto' },
    ],
  },
  {
    type: 'image',
    name: 'Imagen',
    icon: 'Image',
    category: 'content',
    defaultProps: {
      src: '',
      alt: '',
      maxHeight: 300,
      link: '',
    },
    editableProps: [
      { name: 'src', type: 'image', label: 'URL de imagen', required: true },
      { name: 'alt', type: 'text', label: 'Texto alternativo' },
      { name: 'maxHeight', type: 'number', label: 'Altura máxima' },
      { name: 'link', type: 'text', label: 'Link (URL)' },
    ],
  },
  
  // Products
  {
    type: 'product-summary.shelf',
    name: 'Vitrina de Productos',
    icon: 'ShoppingBag',
    category: 'products',
    defaultProps: {
      collection: null,
      maxItems: 8,
      titleText: 'Productos Destacados',
      hideOutOfStockItems: true,
      orderBy: 'OrderByTopSaleDESC',
    },
    editableProps: [
      { name: 'collection', type: 'number', label: 'ID de Colección VTEX', required: true },
      { name: 'maxItems', type: 'number', label: 'Cantidad máxima' },
      { name: 'titleText', type: 'text', label: 'Título' },
      { 
        name: 'orderBy', 
        type: 'select', 
        label: 'Ordenar por',
        options: [
          { value: 'OrderByTopSaleDESC', label: 'Más vendidos' },
          { value: 'OrderByPriceASC', label: 'Precio: menor a mayor' },
          { value: 'OrderByPriceDESC', label: 'Precio: mayor a menor' },
          { value: 'OrderByNameASC', label: 'Nombre A-Z' },
          { value: 'OrderByReleaseDateDESC', label: 'Novedades' },
        ]
      },
      { name: 'hideOutOfStockItems', type: 'boolean', label: 'Ocultar sin stock' },
    ],
  },
  
  // Media
  {
    type: 'slider-layout',
    name: 'Carrusel de Banners',
    icon: 'ImagePlus',
    category: 'media',
    defaultProps: {
      items: [
        {
          image: '',
          mobileImage: '',
          title: '',
          link: { url: '' },
        }
      ],
      autoplay: { timeout: 5000 },
      showNavigationArrows: 'always',
      showPaginationDots: 'always',
    },
    editableProps: [
      { name: 'autoplay.timeout', type: 'number', label: 'Tiempo entre slides (ms)' },
      { 
        name: 'showNavigationArrows', 
        type: 'select', 
        label: 'Mostrar flechas',
        options: [
          { value: 'always', label: 'Siempre' },
          { value: 'never', label: 'Nunca' },
          { value: 'desktopOnly', label: 'Solo desktop' },
        ]
      },
      { 
        name: 'showPaginationDots', 
        type: 'select', 
        label: 'Mostrar puntos',
        options: [
          { value: 'always', label: 'Siempre' },
          { value: 'never', label: 'Nunca' },
          { value: 'desktopOnly', label: 'Solo desktop' },
        ]
      },
    ],
  },
  
  // Info Card
  {
    type: 'info-card',
    name: 'Tarjeta de Información',
    icon: 'Layout',
    category: 'content',
    defaultProps: {
      id: 'info-card-default',
      isFullModeStyle: false,
      textPosition: 'left',
      imageUrl: 'https://storecomponents.vteximg.com.br/arquivos/banner-infocard2.png',
      headline: 'Ofertas Especiales',
      callToActionText: 'COMPRAR AHORA',
      callToActionUrl: '/sale',
      blockClass: 'info-card',
      textAlignment: 'center',
    },
    editableProps: [
      { name: 'id', type: 'text', label: 'ID único', required: true },
      { name: 'headline', type: 'text', label: 'Título', required: true },
      { name: 'textPosition', type: 'select', label: 'Posición del texto',
        options: [
          { value: 'left', label: 'Izquierda' },
          { value: 'right', label: 'Derecha' },
          { value: 'center', label: 'Centro' },
        ]
      },
      { name: 'imageUrl', type: 'image', label: 'URL de imagen' },
      { name: 'callToActionText', type: 'text', label: 'Texto del botón' },
      { name: 'callToActionUrl', type: 'text', label: 'URL del botón' },
      { name: 'isFullModeStyle', type: 'boolean', label: 'Estilo completo' },
      { name: 'textAlignment', type: 'select', label: 'Alineación del texto',
        options: [
          { value: 'left', label: 'Izquierda' },
          { value: 'center', label: 'Centro' },
          { value: 'right', label: 'Derecha' },
        ]
      },
    ],
  },
  
  // Product List Context
  {
    type: 'list-context.product-list',
    name: 'Lista de Productos',
    icon: 'ShoppingBag',
    category: 'products',
    defaultProps: {
      collection: null,
      orderBy: 'OrderByTopSaleDESC',
      maxItems: 10,
      hideOutOfStockItems: true,
    },
    editableProps: [
      { name: 'collection', type: 'number', label: 'ID de Colección VTEX', required: true },
      { name: 'orderBy', type: 'select', label: 'Ordenar por',
        options: [
          { value: 'OrderByTopSaleDESC', label: 'Más vendidos' },
          { value: 'OrderByPriceASC', label: 'Precio: menor a mayor' },
          { value: 'OrderByPriceDESC', label: 'Precio: mayor a menor' },
          { value: 'OrderByNameASC', label: 'Nombre A-Z' },
          { value: 'OrderByReleaseDateDESC', label: 'Novedades' },
        ]
      },
      { name: 'maxItems', type: 'number', label: 'Cantidad máxima' },
      { name: 'hideOutOfStockItems', type: 'boolean', label: 'Ocultar sin stock' },
    ],
  },
  
  // Image List
  {
    type: 'list-context.image-list',
    name: 'Lista de Imágenes',
    icon: 'ImagePlus',
    category: 'media',
    defaultProps: {
      height: 570,
      preload: true,
      images: [
        {
          image: '',
          mobileImage: '',
        }
      ],
    },
    editableProps: [
      { name: 'height', type: 'number', label: 'Altura (px)' },
      { name: 'preload', type: 'boolean', label: 'Precargar' },
    ],
  },
]

export const getComponentByType = (type: string): ComponentDefinition | undefined => {
  return availableComponents.find(c => c.type === type)
}

export const getComponentsByCategory = (category: string): ComponentDefinition[] => {
  return availableComponents.filter(c => c.category === category)
}
