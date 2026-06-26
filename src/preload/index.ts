import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'

const api = {
  ssh: {
    connect: (config: any) => ipcRenderer.invoke(IPC_CHANNELS.SSH_CONNECT, config),
    disconnect: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.SSH_DISCONNECT, id),
    exec: (id: string, cmd: string) => ipcRenderer.invoke(IPC_CHANNELS.SSH_EXEC, id, cmd),
    write: (id: string, data: string) => ipcRenderer.send(IPC_CHANNELS.SSH_DATA, id, data),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.send(IPC_CHANNELS.SSH_RESIZE, id, cols, rows),
    onData: (cb: (id: string, data: string) => void) => {
      const handler = (_: any, id: string, data: string) => cb(id, data)
      ipcRenderer.on(IPC_CHANNELS.SSH_DATA, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SSH_DATA, handler)
    },
    onConnected: (cb: (id: string) => void) => {
      const handler = (_: any, id: string) => cb(id)
      ipcRenderer.on(IPC_CHANNELS.SSH_CONNECTED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SSH_CONNECTED, handler)
    },
    onDisconnected: (cb: (id: string) => void) => {
      const handler = (_: any, id: string) => cb(id)
      ipcRenderer.on(IPC_CHANNELS.SSH_DISCONNECTED, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SSH_DISCONNECTED, handler)
    },
    onError: (cb: (id: string, error: string) => void) => {
      const handler = (_: any, id: string, error: string) => cb(id, error)
      ipcRenderer.on(IPC_CHANNELS.SSH_ERROR, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SSH_ERROR, handler)
    }
  },
  sftp: {
    list: (id: string, path: string) => ipcRenderer.invoke(IPC_CHANNELS.SFTP_LIST, id, path),
    upload: (id: string, local: string, remote: string) => ipcRenderer.invoke(IPC_CHANNELS.SFTP_UPLOAD, id, local, remote),
    download: (id: string, remote: string, local: string) => ipcRenderer.invoke(IPC_CHANNELS.SFTP_DOWNLOAD, id, remote, local),
    delete: (id: string, path: string) => ipcRenderer.invoke(IPC_CHANNELS.SFTP_DELETE, id, path),
    mkdir: (id: string, path: string) => ipcRenderer.invoke(IPC_CHANNELS.SFTP_MKDIR, id, path),
    rename: (id: string, old: string, newPath: string) => ipcRenderer.invoke(IPC_CHANNELS.SFTP_RENAME, id, old, newPath),
    onProgress: (cb: (id: string, progress: any) => void) => {
      const handler = (_: any, id: string, progress: any) => cb(id, progress)
      ipcRenderer.on(IPC_CHANNELS.SFTP_PROGRESS, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SFTP_PROGRESS, handler)
    }
  },
  store: {
    get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.STORE_GET, key),
    set: (key: string, value: any) => ipcRenderer.invoke(IPC_CHANNELS.STORE_SET, key, value),
    delete: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.STORE_DELETE, key)
  },
  keys: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.KEY_LIST),
    generate: (name: string, type: string) => ipcRenderer.invoke(IPC_CHANNELS.KEY_GENERATE, name, type),
    import: (name: string, path: string) => ipcRenderer.invoke(IPC_CHANNELS.KEY_IMPORT, name, path),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.KEY_DELETE, id),
    getPublic: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.KEY_GET_PUBLIC, id)
  },
  dialog: {
    openFile: (options?: any) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, options),
    saveFile: (options?: any) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, options)
  },
  window: {
    minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
    setTheme: (theme: string) => ipcRenderer.send('theme:change', theme)
  },
  localShell: {
    create: (id: string, cols?: number, rows?: number) => ipcRenderer.send('local-shell:create', id, cols, rows),
    write: (id: string, data: string) => ipcRenderer.send('local-shell:write', id, data),
    resize: (id: string, cols: number, rows: number) => ipcRenderer.send('local-shell:resize', id, cols, rows),
    kill: (id: string) => ipcRenderer.send('local-shell:kill', id),
    onData: (cb: (id: string, data: string) => void) => {
      const handler = (_: any, id: string, data: string) => cb(id, data)
      ipcRenderer.on('local-shell:data', handler)
      return () => ipcRenderer.removeListener('local-shell:data', handler)
    },
    onConnected: (cb: (id: string) => void) => {
      const handler = (_: any, id: string) => cb(id)
      ipcRenderer.on('local-shell:connected', handler)
      return () => ipcRenderer.removeListener('local-shell:connected', handler)
    },
    onDisconnected: (cb: (id: string) => void) => {
      const handler = (_: any, id: string) => cb(id)
      ipcRenderer.on('local-shell:disconnected', handler)
      return () => ipcRenderer.removeListener('local-shell:disconnected', handler)
    }
  },
  menu: {
    onNewLocalTerminal: (cb: () => void) => {
      const handler = () => cb()
      ipcRenderer.on('menu:new-local-terminal', handler)
      return () => ipcRenderer.removeListener('menu:new-local-terminal', handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
