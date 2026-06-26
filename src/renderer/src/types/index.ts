export interface SSHConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  password?: string
  privateKeyPath?: string
  passphrase?: string
  group: string
  color?: string
  lastConnected?: number
  tags?: string[]
}

export interface ConnectionGroup {
  id: string
  name: string
  icon?: string
  connections: string[]
}

export interface SSHKey {
  id: string
  name: string
  type: 'rsa' | 'ed25519' | 'ecdsa'
  publicKey: string
  privateKeyPath: string
  createdAt: number
}

export interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory' | 'symlink'
  size: number
  modifyTime: number
  permissions: string
  owner: string
  group: string
}

export interface TransferProgress {
  id: string
  filename: string
  direction: 'upload' | 'download'
  total: number
  transferred: number
  speed: number
  status: 'pending' | 'transferring' | 'completed' | 'error'
  error?: string
}

export interface PortForward {
  id: string
  name: string
  type: 'local' | 'remote' | 'dynamic'
  localHost: string
  localPort: number
  remoteHost: string
  remotePort: number
  connectionId: string
}

export interface TerminalTheme {
  name: string
  background: string
  foreground: string
  cursor: string
  cursorAccent: string
  selectionBackground: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}

export interface AppSettings {
  theme: 'dark' | 'light'
  terminalTheme: string
  fontSize: number
  fontFamily: string
  defaultPort: number
  keepAliveInterval: number
  connectionTimeout: number
  scrollback: number
  cursorStyle: 'block' | 'underline' | 'bar'
  cursorBlink: boolean
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface TabInfo {
  id: string
  connectionId: string
  title: string
  status: ConnectionStatus
  type: 'local' | 'ssh'
}
