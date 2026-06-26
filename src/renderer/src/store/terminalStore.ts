import { create } from 'zustand'
import { TabInfo } from '../types'

interface TerminalState {
  tabs: TabInfo[]
  activeTabId: string | null

  addTab: (tab: TabInfo) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string | null) => void
  updateTab: (id: string, updates: Partial<TabInfo>) => void
  getTabByConnection: (connectionId: string) => TabInfo | undefined
  addLocalTab: () => void
}

let localTerminalCounter = 1

// 默认的本地终端标签
const defaultLocalTab: TabInfo = {
  id: 'local-1',
  connectionId: 'local-1',
  title: '本地终端 1',
  status: 'connected',
  type: 'local'
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [defaultLocalTab],
  activeTabId: 'local-1',

  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    })),

  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id)
      const newActiveId =
        state.activeTabId === id
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1].id
            : null
          : state.activeTabId
      return { tabs: newTabs, activeTabId: newActiveId }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t))
    })),

  getTabByConnection: (connectionId) => {
    return get().tabs.find((t) => t.connectionId === connectionId)
  },

  addLocalTab: () => {
    localTerminalCounter++
    const tab: TabInfo = {
      id: `local-${localTerminalCounter}`,
      connectionId: `local-${localTerminalCounter}`,
      title: `本地终端 ${localTerminalCounter}`,
      status: 'connected',
      type: 'local'
    }
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    }))
  }
}))
