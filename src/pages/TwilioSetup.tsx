import { useState, useEffect } from 'react'
import { Phone, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface User {
  role: string;
  email: string;
  agentId?: number;
}

interface TwilioSetupProps {
  user: User;
}

export function TwilioSetup() {
  const [formData, setFormData] = useState({
    accountSid: 'AC75988346548d3ba099d8177fc6d8b6a9',
    authToken: '8c5322bd1a77aab2d57056077dc78df2',
    phoneNumber: '+18148460215'
  })
  const [status, setStatus] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch('/status')
      if (response.ok) {
        const data = await response.json()
        setIsConfigured(data.hasActiveCall !== undefined)
      }
    } catch (error) {
      console.error('Error checking status:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('')
    
    try {
      const response = await fetch('/api/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStatus('✅ Twilio configured successfully!')
        setIsConfigured(true)
      } else {
        setStatus(`❌ Configuration failed: ${result.message}`)
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Twilio Configuration</h1>
        <p className="text-gray-600 text-lg">Set up your Twilio account for making calls</p>
      </div>

      {/* Status */}
      {status && (
        <div className={`p-4 rounded-lg ${
          status.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center">
            {status.includes('✅') ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">{status}</span>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Twilio Account Settings
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account SID
              </label>
              <input
                type="text"
                value={formData.accountSid}
                onChange={(e) => setFormData(prev => ({ ...prev, accountSid: e.target.value }))}
                className="input"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auth Token
              </label>
              <input
                type="password"
                value={formData.authToken}
                onChange={(e) => setFormData(prev => ({ ...prev, authToken: e.target.value }))}
                className="input"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twilio Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="input"
                placeholder="+1234567890"
                required
              />
            </div>
            
            <button type="submit" className="btn-primary w-full">
              <Phone className="h-4 w-4 mr-2" />
              Configure Twilio
            </button>
          </form>
        </div>

        {/* Important Notes */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            Important Notes
          </h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Your Twilio credentials are stored securely and never shared</p>
            </div>
            
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Trial accounts have limitations on call destinations and features</p>
            </div>
            
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Make sure your Twilio phone number is verified and active</p>
            </div>
            
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>For production use, upgrade to a paid Twilio account</p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Twilio Status</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Phone Number</span>
              <span className="text-sm text-gray-900">{formData.phoneNumber}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Account SID</span>
              <span className="text-sm text-gray-900">{formData.accountSid.substring(0, 10)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
