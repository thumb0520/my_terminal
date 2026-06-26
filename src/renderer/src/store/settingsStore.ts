import { create } from 'zustand'
import { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings
  sidebarWidth: number
  filePanelOpen: boolean

  setSettings: (settings: Partial<AppSettings>) => void
  setSidebarWidth: (width: number) => void
  setFilePanelOpen: (open: boolean) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  terminalTheme: 'catppuccin-mocha',
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Menlo, monospace',
  defaultPort: 22,
  keepAliveInterval: 30000,
  connectionTimeout: 10000,
  scrollback: 10000,
  cursorStyle: 'block',
  cursorBlink: true
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  sidebarWidth: 280,
  filePanelOpen: false,

  setSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates }
    })),

  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setFilePanelOpen: (open) => set({ filePanelOpen: open }),

  loadSettings: async () => {
    try {
      const saved = await window.api.store.get('settings')
      if (saved) {
        set({ settings: { ...defaultSettings, ...saved } })
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  },

  saveSettings: async () => {
    try {
      await window.api.store.set('settings', get().settings)
    } catch (err) {
      console.error('Failed to save settings:', err)
    }
  }
}))
