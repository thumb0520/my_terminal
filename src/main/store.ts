import Store from 'electron-store'

interface StoreData {
  connections: any[]
  groups: any[]
  settings: any
  keys: any[]
}

export class StoreManager {
  private store: Store<StoreData>

  constructor() {
    this.store = new Store<StoreData>({
      defaults: {
        connections: [],
        groups: [
          { id: 'default', name: '默认分组', icon: '📁', connections: [] }
        ],
        settings: {
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
        },
        keys: []
      }
    })
  }

  get(key: string): any {
    return this.store.get(key)
  }

  set(key: string, value: any): void {
    this.store.set(key, value)
  }

  delete(key: string): void {
    this.store.delete(key as any)
  }
}
