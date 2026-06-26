import React, { useState, useMemo } from 'react'
import { useConnectionStore } from '../../store/connectionStore'
import { useSSH } from '../../hooks/useSSH'
import { SearchBar } from './SearchBar'
import { ConnectionForm } from './ConnectionForm'
import { SSHConnection } from '../../types'

export function ConnectionList() {
  const { connections, groups, connectionStatuses, activeConnectionId } = useConnectionStore()
  const { connect, disconnect, saveConnection, deleteConnection } = useSSH()
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['default']))

  const filteredConnections = useMemo(() => {
    if (!searchQuery) return connections
    const query = searchQuery.toLowerCase()
    return connections.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.host.toLowerCase().includes(query) ||
        c.username.toLowerCase().includes(query)
    )
  }, [connections, searchQuery])

  const groupedConnections = useMemo(() => {
    const map = new Map<string, SSHConnection[]>()
    for (const conn of filteredConnections) {
      const group = conn.group || 'default'
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(conn)
    }
    return map
  }, [filteredConnections])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleConnect = async (conn: SSHConnection) => {
    const status = connectionStatuses[conn.id]
    if (status === 'connected' || status === 'connecting') {
      await disconnect(conn.id)
    } else {
      try {
        await connect(conn)
      } catch (err: any) {
        console.error('Connection failed:', err.message)
      }
    }
  }

  const handleSave = async (connection: SSHConnection) => {
    await saveConnection(connection)
    setShowForm(false)
    setEditingConnection(null)
  }

  const getStatusIcon = (id: string) => {
    const status = connectionStatuses[id]
    switch (status) {
      case 'connected':
        return '🟢'
      case 'connecting':
        return '🟡'
      case 'error':
        return '🔴'
      default:
        return '⚪'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <SearchBar onSearch={setSearchQuery} />

      <div className="flex-1 overflow-y-auto px-2">
        {Array.from(groupedConnections.entries()).map(([groupId, conns]) => {
          const group = groups.find((g) => g.id === groupId)
          const isExpanded = expandedGroups.has(groupId)

          return (
            <div key={groupId} className="mb-2">
              <button
                onClick={() => toggleGroup(groupId)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-sidebar-muted hover:text-sidebar-text transition-colors"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{group?.icon || '📁'}</span>
                <span className="font-medium">{group?.name || groupId}</span>
                <span className="ml-auto text-xs bg-sidebar-hover rounded-full px-2 py-0.5">
                  {conns.length}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-2">
                  {conns.map((conn) => (
                    <div
                      key={conn.id}
                      className={`connection-item flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group ${
                        activeConnectionId === conn.id ? 'active' : ''
                      }`}
                      onClick={() => handleConnect(conn)}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: conn.color || '#89b4fa' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-sidebar-text truncate">
                          {conn.name}
                        </div>
                        <div className="text-xs text-sidebar-muted truncate">
                          {conn.username}@{conn.host}:{conn.port}
                        </div>
                      </div>
                      <span className="text-xs">{getStatusIcon(conn.id)}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingConnection(conn)
                            setShowForm(true)
                          }}
                          className="p-1 hover:bg-sidebar-active rounded"
                          title="编辑"
                        >
                          <svg className="w-3.5 h-3.5 text-sidebar-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('确定删除此连接?')) deleteConnection(conn.id)
                          }}
                          className="p-1 hover:bg-sidebar-active rounded"
                          title="删除"
                        >
                          <svg className="w-3.5 h-3.5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-3 py-3 border-t border-sidebar-hover">
        <button
          onClick={() => {
            setEditingConnection(null)
            setShowForm(true)
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent-blue text-[#11111b] rounded-lg font-medium hover:brightness-110 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建连接
        </button>
      </div>

      {showForm && (
        <ConnectionForm
          connection={editingConnection}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingConnection(null)
          }}
        />
      )}
    </div>
  )
}
