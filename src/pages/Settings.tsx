import { useState } from 'react'
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react'

export function Settings() {
  const [settings, setSettings] = useState({
    companyName: 'AI Dialer',
    timezone: 'PST',
    autoSave: true,
    notifications: true
  })

  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        alert('Failed to save settings. Please try again.')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 text-lg">Configure your application preferences</p>
      </div>

      {/* Settings Form */}
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            General Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="input"
              >
                <option value="PST">PST</option>
                <option value="MST">MST</option>
                <option value="CST">CST</option>
                <option value="EST">EST</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-save</label>
                <p className="text-sm text-gray-500">Automatically save changes</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Notifications</label>
                <p className="text-sm text-gray-500">Show system notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button onClick={handleSave} className="btn-primary">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
            
            <button className="btn-secondary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
