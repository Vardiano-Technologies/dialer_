import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Users, Clock, TrendingUp, Upload, PhoneCall } from 'lucide-react'

export function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalCalls: 0,
    successRate: 0,
    totalDuration: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [leadsRes, callsRes] = await Promise.all([
        fetch('/status'),
        fetch('/status')
      ])
      
      if (leadsRes.ok) {
        const leads = await leadsRes.json()
        setStats(prev => ({ ...prev, totalLeads: leads.length }))
      }
      
      if (callsRes.ok) {
        const calls = await callsRes.json()
        const totalDuration = calls.reduce((sum: number, call: any) => sum + (call.duration || 0), 0)
        const successCalls = calls.filter((call: any) => call.status === 'completed').length
        const successRate = calls.length > 0 ? Math.round((successCalls / calls.length) * 100) : 0
        
        setStats(prev => ({ 
          ...prev, 
          totalCalls: calls.length,
          successRate,
          totalDuration
        }))
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Dialer Dashboard</h1>
        <p className="text-gray-600 text-lg">Manage leads, make calls, and track performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Phone className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalDuration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/dialer"
              className="flex items-center p-3 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors duration-200"
            >
              <PhoneCall className="h-5 w-5 mr-3" />
              <span>Make a Call</span>
            </Link>
            
            <Link
              to="/leads"
              className="flex items-center p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors duration-200"
            >
              <Upload className="h-5 w-5 mr-3" />
              <span>Bulk Upload Leads</span>
            </Link>
            
            <Link
              to="/twilio-setup"
              className="flex items-center p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200"
            >
              <Phone className="h-5 w-5 mr-3" />
              <span>Configure Twilio</span>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">Call completed</span>
              </div>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">New lead added</span>
              </div>
              <span className="text-xs text-gray-500">5 min ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">Call started</span>
              </div>
              <span className="text-xs text-gray-500">8 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
