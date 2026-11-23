import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { EndpointBuilder } from '../components/EndpointBuilder'
import { ChaosConfigurator } from '../components/ChaosConfigurator'
import { ArrowLeft, Trash2, ExternalLink, Copy } from 'lucide-react'

const fetchProject = async (id) => {
  const { data } = await apiClient.get(`/api/v1/projects/${id}`)
  return data
}

const deleteEndpoint = async (id) => {
  await apiClient.delete(`/api/v1/endpoints/${id}`)
}

const methodClass = (m) => {
  if (m === 'GET')    return 'badge-get'
  if (m === 'POST')   return 'badge-post'
  if (m === 'PUT')    return 'badge-put'
  if (m === 'DELETE') return 'badge-delete'
  return 'bg-zinc-800 text-zinc-400'
}

export const ProjectDetails = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState('create')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      setSelected(null)
      setMode('create')
    },
  })

  const mockUrl = (ep) =>
    `http://localhost:8080/mock/${project?.api_key}/${ep.route_path}`

  const copyKey = () => {
    if (project) {
      navigator.clipboard.writeText(project.api_key)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center text-zinc-600 text-sm">
      Loading…
    </div>
  )

  if (!project) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center text-zinc-600 text-sm">
      Project not found.
    </div>
  )

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center gap-4 shrink-0">
        <Link to="/" className="btn-ghost flex items-center gap-1.5 text-xs">
          <ArrowLeft size={13} /> back
        </Link>
        <div className="w-px h-4 bg-[#1f1f1f]" />
        <span className="text-zinc-100 font-medium">{project.name}</span>
        <button
          onClick={copyKey}
          className="mono text-[11px] text-zinc-600 hover:text-zinc-300 flex items-center gap-1.5 transition-colors ml-1"
        >
          {project.api_key}
          <Copy size={11} className={copied ? 'text-indigo-400' : ''} />
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — endpoint list */}
        <aside className="w-64 border-r border-[#1a1a1a] flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Endpoints</span>
            <button
              className={`text-xs transition-colors ${mode === 'create' && !selected ? 'text-indigo-400' : 'btn-ghost'}`}
              onClick={() => { setSelected(null); setMode('create') }}
            >
              + New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {project.endpoints?.length === 0 ? (
              <div className="px-4 py-6 text-xs text-zinc-700">No endpoints yet.</div>
            ) : (
              project.endpoints?.map(ep => (
                <div
                  key={ep.id}
                  onClick={() => { setSelected(ep); setMode('view') }}
                  className={`group flex items-center gap-2 px-4 py-2.5 border-b border-[#111] cursor-pointer transition-colors ${
                    selected?.id === ep.id ? 'bg-[#111111]' : 'hover:bg-[#0d0d0d]'
                  }`}
                >
                  <span className={`method-badge shrink-0 ${methodClass(ep.http_method)}`}>
                    {ep.http_method}
                  </span>
                  <span className="mono text-[11px] text-zinc-400 truncate flex-1">
                    /{ep.route_path}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteMutation.mutate(ep.id) }}
                    className="btn-danger opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right — content */}
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {mode === 'create' || !selected ? (
            <div className="max-w-xl">
              <h2 className="text-sm font-medium text-zinc-300 mb-6">Create endpoint</h2>
              <EndpointBuilder
                projectId={parseInt(id)}
                onCreated={() => {}}
              />
            </div>
          ) : (
            <div className="max-w-2xl space-y-6">
              {/* URL bar */}
              <div className="card flex items-center gap-3 px-4 py-3">
                <span className={`method-badge ${methodClass(selected.http_method)}`}>
                  {selected.http_method}
                </span>
                <span className="mono text-xs text-zinc-400 flex-1 truncate">
                  http://localhost:8080/mock/{project.api_key}/
                  <span className="text-zinc-200">{selected.route_path}</span>
                </span>
                <a
                  href={mockUrl(selected)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Response payload */}
              <div>
                <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Response payload</p>
                <div className="card px-4 py-4 overflow-x-auto">
                  <pre className="mono text-[12px] text-emerald-400 leading-relaxed">
                    {JSON.stringify(selected.response_payload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-600 uppercase tracking-wider">Status</p>
                <span className={`mono text-xs font-medium ${selected.default_status_code < 400 ? 'status-ok' : 'status-err'}`}>
                  {selected.default_status_code}
                </span>
              </div>

              {/* Chaos */}
              <div className="divider pt-6">
                <ChaosConfigurator
                  endpointId={selected.id}
                  existingProfile={selected.chaos_profile}
                  projectId={id}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
