import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import TopicExplorer from './pages/TopicExplorer'
import AttentionNetwork from './pages/AttentionNetwork'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="explorer" element={<TopicExplorer />} />
          <Route path="network" element={<AttentionNetwork />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}