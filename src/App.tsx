import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Leads } from './pages/Leads'
import { Calls } from './pages/Calls'
import { Settings } from './pages/Settings'
import { Dialer } from './pages/Dialer'
import { TwilioSetup } from './pages/TwilioSetup'
import { Agents } from './pages/Agents'

interface User {
  role: string;
  email: string;
  name?: string;
  agentId?: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoginError('');
      
      // Check if it's the admin email
      if (email === 'admin@company.com' && password === 'admin123') {
        setUser({
          role: 'admin',
          email: email,
          name: 'Admin User'
        });
        return;
      }

      // Check if it's a valid agent email from database
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) {
          throw new Error('Server not responding');
        }
        
        const agents = await response.json();
        const agent = agents.find((a: any) => a.email === email);

        if (agent) {
          setUser({
            role: 'agent',
            email: email,
            name: agent.name,
            agentId: agent.id
          });
        } else {
          setLoginError('Invalid email. Please check your email or contact admin.');
        }
      } catch (apiError) {
        setLoginError('Server not available. Please make sure the backend is running.');
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    }
  };

  // Login page with proper authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">AI Dialer Login</h1>
          
          <LoginForm onLogin={handleLogin} error={loginError} />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout userRole={user.role} userName={user.name} onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/agents" element={<Agents userRole={user.role} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dialer" element={<Dialer />} />
          <Route path="/twilio-setup" element={<TwilioSetup />} />
        </Routes>
      </Layout>
    </Router>
  )
}

// Login Form Component
interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  error: string;
}

function LoginForm({ onLogin, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
          placeholder="Enter your email"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm text-center">{error}</div>
      )}
      
      <div className="text-xs text-gray-500 text-center mt-4">
        <p>Contact your administrator for login credentials</p>
      </div>
    </form>
  );
}

export default App
