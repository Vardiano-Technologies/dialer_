import { useState, useEffect } from 'react'
import { Users, Plus, Upload, Trash2, Edit, Phone } from 'lucide-react'

interface User {
  role: string;
  email: string;
  agentId?: number;
}

interface LeadsProps {
  user: User;
}

interface Lead {
  id: string
  firstName: string
  lastName: string
  phoneE164: string
  email: string
  state: string
  timezone: string
  status: string
  createdAt: string
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneE164: '',
    email: '',
    state: '',
    timezone: 'PST'
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads'
      const method = editingLead ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowAddForm(false)
        setEditingLead(null)
        resetForm()
        fetchLeads()
        alert(editingLead ? 'Lead updated successfully!' : 'Lead added successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to save lead'}`)
      }
    } catch (error) {
      console.error('Error saving lead:', error)
      alert('Error saving lead. Please try again.')
    }
  }

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      phoneE164: lead.phoneE164,
      email: lead.email,
      state: lead.state,
      timezone: lead.timezone
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        const response = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
        if (response.ok) {
          fetchLeads()
          alert('Lead deleted successfully!')
        } else {
          const error = await response.json()
          alert(`Error: ${error.message || 'Failed to delete lead'}`)
        }
      } catch (error) {
        console.error('Error deleting lead:', error)
        alert('Error deleting lead. Please try again.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phoneE164: '',
      email: '',
      state: '',
      timezone: 'PST'
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const csv = event.target?.result as string
        const lines = csv.split('\n')
        const headers = lines[0].split(',')
        
        const newLeads = lines.slice(1).map(line => {
          const values = line.split(',')
          return {
            firstName: values[0] || '',
            lastName: values[1] || '',
            phoneE164: values[2] || '',
            email: values[3] || '',
            state: values[4] || '',
            timezone: values[5] || 'PST'
          }
        }).filter(lead => lead.phoneE164)
        
        // Upload leads
        for (const lead of newLeads) {
          try {
            await fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lead)
            })
          } catch (error) {
            console.error('Error uploading lead:', error)
          }
        }
        
        fetchLeads()
        alert(`Uploaded ${newLeads.length} leads`)
      }
      reader.readAsText(file)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading leads...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-gray-400">Manage your leads and contacts</p>
        </div>
        
        <div className="flex space-x-3">
          <label className="btn-secondary cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingLead ? 'Edit Lead' : 'Add New Lead'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneE164}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneE164: e.target.value }))}
                  className="input"
                  placeholder="+1234567890"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="input"
                >
                  <option value="PST">PST</option>
                  <option value="MST">MST</option>
                  <option value="CST">CST</option>
                  <option value="EST">EST</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                {editingLead ? 'Update Lead' : 'Add Lead'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingLead(null)
                  resetForm()
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leads Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            All Leads ({leads.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-gray-400">
                          Added {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-white">{lead.phoneE164}</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {lead.email}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{lead.state}</div>
                    <div className="text-sm text-gray-400">{lead.timezone}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge status-${lead.status.toLowerCase()}`}>
                      {lead.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No leads found. Add your first lead above!
          </div>
        )}
      </div>
    </div>
  )
}
