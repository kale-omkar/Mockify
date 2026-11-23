import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Plus, Trash2 } from 'lucide-react'

const fetchProjects = async () => {
  const { data } = await apiClient.get('/api/v1/projects')
  return data
}

const createProject = async (name) => {
  const { data } = await apiClient.post('/api/v1/projects', { name })
  return data
}

const deleteProject = async (id) => {
  await apiClient.delete(`/api/v1/projects/${id}`)
}

export const Dashboard = () => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setName('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (name.trim()) createMutation.mutate(name.trim())
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="mono text-white font-medium tracking-tight">Mockify</span>
          <span className="mono text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
            v0.1
          </span>
        </div>
        <span className="text-xs text-zinc-600">API Mocking &amp; Chaos Engineering</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Create */}
        <form onSubmit={handleCreate} className="flex gap-2 mb-10">
          <input
            type="text"
            className="input flex-1 mono"
            placeholder="project name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button type="submit" className="btn-primary flex items-center gap-1.5" disabled={createMutation.isPending}>
            <Plus size={14} />
            {createMutation.isPending ? 'Creating…' : 'New Project'}
          </button>
        </form>

        {/* List */}
        {isLoading ? (
          <div className="text-zinc-600 text-sm">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-zinc-700 text-sm">
            No projects yet. Create one above.
          </div>
        ) : (
          <div className="space-y-px">
            {projects.map(project => (
              <div
                key={project.id}
                className="group flex items-center justify-between px-4 py-3 card-hover"
              >
                <Link to={`/project/${project.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-100 font-medium">{project.name}</span>
                    <span className="text-zinc-700 text-xs">
                      {project.endpoints?.length ?? 0} endpoint{project.endpoints?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mono text-[11px] text-zinc-600 mt-0.5 truncate">
                    {project.api_key}
                  </div>
                </Link>
                <button
                  onClick={e => { e.preventDefault(); deleteMutation.mutate(project.id) }}
                  className="btn-danger opacity-0 group-hover:opacity-100 p-1 ml-4"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
