import { useState, useEffect } from 'react'
import { Phone, Clock, User, Mail, Calendar } from 'lucide-react'

interface Call {
  id: string
  phoneNumber: string
  callerName: string
  callerEmail: string
  duration: number
  status: string
  outcome: string
  timestamp: string
  createdAt: string
}

interface User {
  role: string;
  email: string;
  agentId?: number;
}

interface CallsProps {
  user: User;
}

export function Calls() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      const response = await fetch('/api/calls')
      if (response.ok) {
        const data = await response.json()
        setCalls(data)
      }
    } catch (error) {
      console.error('Error fetching calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading calls...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
        <p className="text-gray-600">View all your call records and outcomes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Phone className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{calls.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(calls.reduce((sum, call) => sum + (call.duration || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <User className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Numbers</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(calls.map(call => call.phoneNumber)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Calls</p>
              <p className="text-2xl font-bold text-gray-900">
                {calls.filter(call => {
                  const today = new Date().toDateString()
                  return new Date(call.timestamp).toDateString() === today
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calls Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            All Calls ({calls.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Call Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {call.phoneNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {call.outcome}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{call.callerName}</div>
                    <div className="text-sm text-gray-500">{call.callerEmail}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(call.duration)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                      {call.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(call.timestamp).toLocaleDateString()}</div>
                    <div>{new Date(call.timestamp).toLocaleTimeString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {calls.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Phone className="h-12 w-12 mx-auto mb-3" />
            <p>No calls found. Make your first call from the dialer!</p>
          </div>
        )}
      </div>
    </div>
  )
}
