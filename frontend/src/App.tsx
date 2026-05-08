import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LandingEditor from './pages/LandingEditor'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="landing/new" element={<LandingEditor />} />
        <Route path="landing/:id" element={<LandingEditor />} />
      </Route>
    </Routes>
  )
}

export default App
