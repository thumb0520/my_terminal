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
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [],
  activeTabId: null,

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
  }
}))
