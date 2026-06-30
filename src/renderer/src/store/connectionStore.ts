import { create } from 'zustand'
import { SSHConnection, ConnectionGroup, ConnectionStatus } from '../types'

interface ConnectionState {
  connections: SSHConnection[]
  groups: ConnectionGroup[]
  activeConnectionId: string | null
  connectionStatuses: Record<string, ConnectionStatus>

  setConnections: (connections: SSHConnection[]) => void
  addConnection: (connection: SSHConnection) => void
  updateConnection: (id: string, updates: Partial<SSHConnection>) => void
  removeConnection: (id: string) => void
  setActiveConnection: (id: string | null) => void
  setConnectionStatus: (id: string, status: ConnectionStatus) => void
  setGroups: (groups: ConnectionGroup[]) => void
  addGroup: (group: ConnectionGroup) => void
  removeGroup: (id: string) => void
  loadConnections: () => Promise<void>
  loadGroups: () => Promise<void>
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connections: [],
  groups: [{ id: 'default', name: '默认分组', icon: '📁', connections: [] }],
  activeConnectionId: null,
  connectionStatuses: {},

  setConnections: (connections) => set({ connections }),

  addConnection: (connection) =>
    set((state) => ({
      connections: [...state.connections, connection]
    })),

  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    })),

  removeConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
      activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId
    })),

  setActiveConnection: (id) => set({ activeConnectionId: id }),

  setConnectionStatus: (id, status) =>
    set((state) => ({
      connectionStatuses: { ...state.connectionStatuses, [id]: status }
    })),

  setGroups: (groups) => set({ groups }),

  addGroup: (group) =>
    set((state) => ({
      groups: [...state.groups, group]
    })),

  removeGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id)
    })),

  loadConnections: async () => {
    try {
      const saved = await window.api.store.get('connections')
      if (saved && Array.isArray(saved)) {
        set({ connections: saved })
      }
    } catch (err) {
      console.error('Failed to load connections:', err)
    }
  },

  loadGroups: async () => {
    try {
      const saved = await window.api.store.get('groups')
      if (saved && Array.isArray(saved)) {
        set({ groups: saved })
      }
    } catch (err) {
      console.error('Failed to load groups:', err)
    }
  }
}))
