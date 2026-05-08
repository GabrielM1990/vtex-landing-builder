import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Plus, Settings } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-vtex-pink rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VT</span>
            </div>
            <span className="font-bold text-lg text-vtex-blue">Landing Builder</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/"
            className={`sidebar-item ${isActive('/') ? 'active' : ''}`}
          >
            <LayoutGrid size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link
            to="/landing/new"
            className={`sidebar-item ${isActive('/landing/new') ? 'active' : ''}`}
          >
            <Plus size={20} />
            <span>Nueva Landing</span>
          </Link>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button className="sidebar-item w-full">
            <Settings size={20} />
            <span>Configuración</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            {isActive('/') && 'Dashboard'}
            {isActive('/landing/new') && 'Nueva Landing Page'}
            {location.pathname.startsWith('/landing/') && location.pathname !== '/landing/new' && 'Editar Landing'}
          </h1>
          
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-vtex-pink hover:underline"
            >
              Documentación VTEX →
            </a>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
