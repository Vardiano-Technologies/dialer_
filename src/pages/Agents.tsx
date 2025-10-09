import React, { useState, useEffect } from 'react'
import { User, Plus, Edit, Trash2, Phone, Mail, CheckCircle, XCircle } from 'lucide-react'

interface Agent {
  id: number
  name: string
  email: string
  phone?: string
  agent_phone?: string
  is_active: boolean
  isOnCall?: boolean
}

export function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    agent_phone: '',
    is_active: true
  })

  // Load agents on component mount
  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/agents`)
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      } else {
        console.error('Failed to load agents:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const apiUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'
      const url = editingAgent 
        ? `${apiUrl}/api/agents/${editingAgent.id}`
        : `${apiUrl}/api/agents`
      
      const method = editingAgent ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        setEditingAgent(null)
        setFormData({ name: '', email: '', phone: '', agent_phone: '', is_active: true })
        loadAgents()
        alert('Agent saved successfully!')
      } else {
        const error = await response.json()
        alert('Error: ' + (error.error || 'Failed to save agent'))
      }
    } catch (error) {
      console.error('Error saving agent:', error)
      alert('Network error: ' + error)
    }
  }

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone || '',
      agent_phone: agent.agent_phone || '',
      is_active: agent.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const apiUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/agents/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadAgents()
        alert('Agent deleted successfully!')
      } else {
        const error = await response.json()
        alert('Error: ' + error.error)
      }
    } catch (error) {
      console.error('Error deleting agent:', error)
      alert('Error deleting agent')
    }
  }

  const openAddModal = () => {
    setEditingAgent(null)
    setFormData({ name: '', email: '', phone: '', agent_phone: '', is_active: true })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading agents...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Agent Management</h1>
        <button
          onClick={openAddModal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <User className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Agents</p>
              <p className="text-2xl font-bold text-white">{agents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-400">Available</p>
              <p className="text-2xl font-bold text-white">
                {agents.filter(a => a.is_active && !a.isOnCall).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <Phone className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-400">On Call</p>
              <p className="text-2xl font-bold text-white">
                {agents.filter(a => a.isOnCall).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-white">
                {agents.filter(a => !a.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Agents List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Agent Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{agent.name}</div>
                        <div className="text-sm text-gray-400">ID: {agent.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{agent.email}</div>
                    <div className="text-sm text-gray-400">{agent.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{agent.agent_phone || 'Not set'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {agent.isOnCall ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        On Call
                      </span>
                    ) : agent.is_active ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(agent)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Agent Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+919711794552"
                  value={formData.agent_phone}
                  onChange={(e) => setFormData({ ...formData, agent_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">This is the phone number that will ring when making calls</p>
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-300">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
