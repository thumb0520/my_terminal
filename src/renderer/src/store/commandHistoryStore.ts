import { create } from 'zustand'

const MAX_HISTORY = 100

interface CommandHistoryState {
  commands: string[]
  isLoaded: boolean

  loadHistory: () => Promise<void>
  addCommand: (cmd: string) => Promise<void>
  getCompletions: (partial: string) => string[]
}

export const useCommandHistoryStore = create<CommandHistoryState>((set, get) => ({
  commands: [],
  isLoaded: false,

  loadHistory: async () => {
    try {
      const saved = await window.api.store.get('commandHistory')
      if (Array.isArray(saved)) {
        set({ commands: saved, isLoaded: true })
      } else {
        set({ commands: [], isLoaded: true })
      }
    } catch (e) {
      console.error('[CommandHistory] Failed to load:', e)
      set({ commands: [], isLoaded: true })
    }
  },

  addCommand: async (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    const { commands } = get()

    // 去重：如果和最后一条相同，不添加
    if (commands.length > 0 && commands[0] === trimmed) return

    // 添加到开头，保持最近的在前面
    const newCommands = [trimmed, ...commands.filter(c => c !== trimmed)].slice(0, MAX_HISTORY)

    set({ commands: newCommands })

    // 持久化保存
    try {
      await window.api.store.set('commandHistory', newCommands)
    } catch (e) {
      console.error('[CommandHistory] Failed to save:', e)
    }
  },

  getCompletions: (partial: string) => {
    if (!partial) return []

    const { commands } = get()
    const lower = partial.toLowerCase()

    return commands
      .filter(cmd => cmd.toLowerCase().startsWith(lower) && cmd !== partial)
      .slice(0, 10)
  }
}))
