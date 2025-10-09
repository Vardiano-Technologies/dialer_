import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Leads } from './pages/Leads'
import { Calls } from './pages/Calls'
import { Settings } from './pages/Settings'
import { Dialer } from './pages/Dialer'
import { TwilioSetup } from './pages/TwilioSetup'
import { Agents } from './pages/Agents'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dialer" element={<Dialer />} />
          <Route path="/twilio-setup" element={<TwilioSetup />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
