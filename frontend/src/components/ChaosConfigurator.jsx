import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { CheckCircle } from 'lucide-react'

const ERROR_CODES = [400, 401, 403, 404, 429, 500, 502, 503, 504]

export const ChaosConfigurator = ({ endpointId, projectId, existingProfile }) => {
  const queryClient = useQueryClient()
  const [minLatency, setMinLatency] = useState(0)
  const [maxLatency, setMaxLatency] = useState(0)
  const [errorProb, setErrorProb] = useState(0)
  const [errorCode, setErrorCode] = useState(500)
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (existingProfile) {
      setMinLatency(existingProfile.latency_min_ms)
      setMaxLatency(existingProfile.latency_max_ms)
      setErrorProb(Math.round(existingProfile.error_probability * 100))
      setErrorCode(existingProfile.error_status_code)
    } else {
      setMinLatency(0)
      setMaxLatency(0)
      setErrorProb(0)
      setErrorCode(500)
    }
  }, [existingProfile, endpointId])

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingProfile) {
        await apiClient.delete(`/api/v1/chaos-profiles/${existingProfile.id}`)
      }
      if (data.latency_max_ms > 0 || data.error_probability > 0) {
        await apiClient.post('/api/v1/chaos-profiles', data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setApiError('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail
      setApiError(msg || 'Failed to save chaos profile.')
    },
  })

  const handleSave = () => {
    saveMutation.mutate({
      endpoint_id: endpointId,
      latency_min_ms: minLatency,
      latency_max_ms: Math.max(minLatency, maxLatency),
      error_probability: errorProb / 100,
      error_status_code: errorCode,
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-zinc-600 uppercase tracking-wider">Chaos configuration</p>

      {/* Latency */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Min latency</span>
          <span className="mono text-xs text-zinc-500">{minLatency}ms</span>
        </div>
        <input
          type="range" min="0" max="5000" step="100"
          value={minLatency}
          onChange={e => setMinLatency(parseInt(e.target.value))}
          className="w-full h-1 bg-[#1f1f1f] rounded appearance-none cursor-pointer accent-indigo-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Max latency</span>
          <span className="mono text-xs text-zinc-500">{Math.max(minLatency, maxLatency)}ms</span>
        </div>
        <input
          type="range" min="0" max="5000" step="100"
          value={maxLatency}
          onChange={e => setMaxLatency(parseInt(e.target.value))}
          className="w-full h-1 bg-[#1f1f1f] rounded appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      <div className="divider" />

      {/* Error injection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Failure probability</span>
          <span className={`mono text-xs font-medium ${errorProb > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
            {errorProb}%
          </span>
        </div>
        <input
          type="range" min="0" max="100" step="1"
          value={errorProb}
          onChange={e => setErrorProb(parseInt(e.target.value))}
          className="w-full h-1 bg-[#1f1f1f] rounded appearance-none cursor-pointer accent-red-500"
        />

        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-zinc-400 shrink-0">Error code</span>
          <select
            className="input mono flex-1"
            value={errorCode}
            onChange={e => setErrorCode(parseInt(e.target.value))}
          >
            {ERROR_CODES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Feedback */}
      {apiError && <p className="text-xs text-red-400">{apiError}</p>}
      {saved && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle size={13} /> Saved.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="btn-primary w-full"
      >
        {saveMutation.isPending ? 'Applying…' : 'Apply chaos profile'}
      </button>
    </div>
  )
}
