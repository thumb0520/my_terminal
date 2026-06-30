import { app, BrowserWindow, ipcMain, dialog, Menu, MenuItemConstructorOptions } from 'electron'
import { join } from 'path'
import { SSHManager } from './ssh-manager'
import { SFTPHandler } from './sftp-handler'
import { StoreManager } from './store'
import { KeyManager } from './key-manager'
import { LocalShellManager } from './local-shell'
import { PortForwardManager } from './port-forward-manager'
import { IPC_CHANNELS } from '../shared/constants'

let mainWindow: BrowserWindow | null = null
let sshManager: SSHManager | null = null
let sftpHandler: SFTPHandler | null = null
let storeManager: StoreManager | null = null
let keyManager: KeyManager | null = null
let localShellManager: LocalShellManager | null = null
let portForwardManager: PortForwardManager | null = null

function createMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Local Terminal',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow?.webContents.send('menu:new-local-terminal')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const }
            ]
          : [])
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#11111b',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // 确保键盘事件正常工作
      enableBlinkFeatures: 'KeyboardEventKey,KeyCode',
      // 禁用 macOS 的自动键盘处理
      automaticDashboards: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupIPC(): void {
  sshManager = new SSHManager()
  sftpHandler = new SFTPHandler()
  storeManager = new StoreManager()
  keyManager = new KeyManager()
  localShellManager = new LocalShellManager()
  portForwardManager = new PortForwardManager()

  // SSH connections
  ipcMain.handle(IPC_CHANNELS.SSH_CONNECT, async (_, config) => {
    return sshManager!.connect(config)
  })

  ipcMain.handle(IPC_CHANNELS.SSH_DISCONNECT, async (_, connectionId) => {
    return sshManager!.disconnect(connectionId)
  })

  ipcMain.handle(IPC_CHANNELS.SSH_EXEC, async (_, connectionId, command) => {
    return sshManager!.exec(connectionId, command)
  })

  ipcMain.on(IPC_CHANNELS.SSH_DATA, (_, connectionId, data) => {
    sshManager!.write(connectionId, data)
  })

  ipcMain.on(IPC_CHANNELS.SSH_RESIZE, (_, connectionId, cols, rows) => {
    sshManager!.resize(connectionId, cols, rows)
  })

  // SFTP operations
  ipcMain.handle(IPC_CHANNELS.SFTP_LIST, async (_, connectionId, path) => {
    return sftpHandler!.list(connectionId, path)
  })

  ipcMain.handle(IPC_CHANNELS.SFTP_UPLOAD, async (_, connectionId, localPath, remotePath) => {
    return sftpHandler!.upload(connectionId, localPath, remotePath)
  })

  ipcMain.handle(IPC_CHANNELS.SFTP_DOWNLOAD, async (_, connectionId, remotePath, localPath) => {
    return sftpHandler!.download(connectionId, remotePath, localPath)
  })

  ipcMain.handle(IPC_CHANNELS.SFTP_DELETE, async (_, connectionId, path) => {
    return sftpHandler!.delete(connectionId, path)
  })

  ipcMain.handle(IPC_CHANNELS.SFTP_MKDIR, async (_, connectionId, path) => {
    return sftpHandler!.mkdir(connectionId, path)
  })

  ipcMain.handle(IPC_CHANNELS.SFTP_RENAME, async (_, connectionId, oldPath, newPath) => {
    return sftpHandler!.rename(connectionId, oldPath, newPath)
  })

  // Store operations
  ipcMain.handle(IPC_CHANNELS.STORE_GET, async (_, key) => {
    return storeManager!.get(key)
  })

  ipcMain.handle(IPC_CHANNELS.STORE_SET, async (_, key, value) => {
    return storeManager!.set(key, value)
  })

  ipcMain.handle(IPC_CHANNELS.STORE_DELETE, async (_, key) => {
    return storeManager!.delete(key)
  })

  // Key management
  ipcMain.handle(IPC_CHANNELS.KEY_LIST, async () => {
    return keyManager!.list()
  })

  ipcMain.handle(IPC_CHANNELS.KEY_GENERATE, async (_, name, type) => {
    return keyManager!.generate(name, type)
  })

  ipcMain.handle(IPC_CHANNELS.KEY_IMPORT, async (_, name, path) => {
    return keyManager!.import(name, path)
  })

  ipcMain.handle(IPC_CHANNELS.KEY_DELETE, async (_, id) => {
    return keyManager!.deleteKey(id)
  })

  ipcMain.handle(IPC_CHANNELS.KEY_GET_PUBLIC, async (_, id) => {
    return keyManager!.getPublicKey(id)
  })

  // Dialog
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (_, options) => {
    return dialog.showOpenDialog(mainWindow!, options)
  })

  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_, options) => {
    return dialog.showSaveDialog(mainWindow!, options)
  })

  // Port forwarding
  ipcMain.handle(IPC_CHANNELS.PORT_FORWARD_START, async (_, rule) => {
    return portForwardManager!.start(rule)
  })

  ipcMain.on(IPC_CHANNELS.PORT_FORWARD_STOP, (_, id) => {
    portForwardManager!.stop(id)
  })

  ipcMain.on(IPC_CHANNELS.PORT_FORWARD_STOP_ALL, () => {
    portForwardManager!.stopAll()
  })

  ipcMain.handle(IPC_CHANNELS.PORT_FORWARD_LIST, async () => {
    return portForwardManager!.list()
  })

  // Window controls
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => mainWindow?.minimize())
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => mainWindow?.close())

  // Theme change - update window background
  ipcMain.on('theme:change', (_, theme: string) => {
    if (mainWindow) {
      const color = theme === 'light' ? '#eff1f5' : '#11111b'
      mainWindow.setBackgroundColor(color)
    }
  })

  // Local shell operations
  ipcMain.on('local-shell:create', (_, id: string, cols?: number, rows?: number) => {
    localShellManager!.create(id, { cols, rows })
  })

  ipcMain.on('local-shell:write', (_, id: string, data: string) => {
    localShellManager!.write(id, data)
  })

  ipcMain.on('local-shell:resize', (_, id: string, cols: number, rows: number) => {
    localShellManager!.resize(id, cols, rows)
  })

  ipcMain.on('local-shell:kill', (_, id: string) => {
    localShellManager!.kill(id)
  })

  // Forward local shell events to renderer
  localShellManager.on('data', (id: string, data: string) => {
    console.log('[Main] Forwarding data to renderer:', data.substring(0, 50))
    mainWindow?.webContents.send('local-shell:data', id, data)
  })

  localShellManager.on('connected', (id: string) => {
    mainWindow?.webContents.send('local-shell:connected', id)
  })

  localShellManager.on('disconnected', (id: string) => {
    mainWindow?.webContents.send('local-shell:disconnected', id)
  })

  localShellManager.on('error', (id: string, error: string) => {
    mainWindow?.webContents.send('local-shell:error', id, error)
  })

  // Forward SSH events to renderer
  sshManager.on('data', (id: string, data: string) => {
    mainWindow?.webContents.send(IPC_CHANNELS.SSH_DATA, id, data)
  })

  sshManager.on('connected', (id: string) => {
    // Wire SFTP and port forward handlers to the SSH client
    const client = sshManager?.getClient(id)
    if (client) {
      sftpHandler?.setConnection(id, client)
      portForwardManager?.setClient(id, client)
    }
    mainWindow?.webContents.send(IPC_CHANNELS.SSH_CONNECTED, id)
  })

  sshManager.on('disconnected', (id: string) => {
    sftpHandler?.removeConnection(id)
    portForwardManager?.removeClient(id)
    mainWindow?.webContents.send(IPC_CHANNELS.SSH_DISCONNECTED, id)
  })

  sshManager.on('error', (id: string, error: string) => {
    mainWindow?.webContents.send(IPC_CHANNELS.SSH_ERROR, id, error)
  })

  sftpHandler.on('progress', (id: string, progress: any) => {
    mainWindow?.webContents.send(IPC_CHANNELS.SFTP_PROGRESS, id, progress)
  })

  portForwardManager.on('started', (id: string) => {
    mainWindow?.webContents.send('portForward:started', id)
  })

  portForwardManager.on('stopped', (id: string) => {
    mainWindow?.webContents.send('portForward:stopped', id)
  })

  portForwardManager.on('error', (id: string, error: string) => {
    mainWindow?.webContents.send('portForward:error', id, error)
  })
}

app.whenReady().then(() => {
  createMenu()
  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  portForwardManager?.stopAll()
  await sshManager?.disconnectAll()
  localShellManager?.killAll()
  if (process.platform !== 'darwin') app.quit()
})
