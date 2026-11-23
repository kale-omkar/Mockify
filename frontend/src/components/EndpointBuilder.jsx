import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { CheckCircle } from 'lucide-react'

const METHODS = ['GET', 'POST', 'PUT', 'DELETE']

export const EndpointBuilder = ({ projectId, onCreated }) => {
  const queryClient = useQueryClient()
  const [method, setMethod] = useState('GET')
  const [route, setRoute] = useState('')
  const [status, setStatus] = useState('200')
  const [payload, setPayload] = useState('{\n  "message": "Hello World"\n}')
  const [jsonError, setJsonError] = useState('')
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/api/v1/endpoints', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', String(projectId)] })
      setRoute('')
      setPayload('{\n  "message": "Hello World"\n}')
      setJsonError('')
      setApiError('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onCreated()
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail
      setApiError(msg || 'Failed to create endpoint.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setApiError('')
    try {
      const parsed = JSON.parse(payload)
      createMutation.mutate({
        project_id: projectId,
        http_method: method,
        route_path: route.replace(/^\/+/, ''),
        response_payload: parsed,
        default_status_code: parseInt(status),
      })
    } catch {
      setJsonError('Invalid JSON')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Method + Route + Status */}
      <div className="flex gap-2">
        <select
          className="input w-28 mono"
          value={method}
          onChange={e => setMethod(e.target.value)}
        >
          {METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
        <input
          type="text"
          className="input flex-1 mono"
          placeholder="api/users"
          required
          value={route}
          onChange={e => { setRoute(e.target.value); setApiError('') }}
        />
        <input
          type="number"
          className="input w-20 mono"
          required
          value={status}
          onChange={e => setStatus(e.target.value)}
        />
      </div>

      {/* Payload */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-zinc-600 uppercase tracking-wider">Payload</span>
          {jsonError && <span className="text-xs text-red-400">{jsonError}</span>}
        </div>
        <textarea
          className="input mono text-emerald-400 text-xs leading-relaxed h-52 resize-y"
          value={payload}
          onChange={e => { setPayload(e.target.value); setJsonError('') }}
        />
      </div>

      {/* Feedback */}
      {apiError && (
        <p className="text-xs text-red-400">{apiError}</p>
      )}
      {saved && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle size={13} /> Endpoint created — select it from the sidebar.
        </div>
      )}

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="btn-primary w-full"
      >
        {createMutation.isPending ? 'Saving…' : 'Save endpoint'}
      </button>
    </form>
  )
}
