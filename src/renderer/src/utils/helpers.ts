export function generateId(): string {
  return crypto.randomUUID()
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + units[i]
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function truncatePath(path: string, maxLen: number): string {
  if (path.length <= maxLen) return path
  const parts = path.split('/')
  if (parts.length <= 3) return '...' + path.slice(-maxLen)
  return parts[0] + '/.../' + parts[parts.length - 1]
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase()
}

export function isTextFile(filename: string): boolean {
  const textExtensions = [
    'txt', 'md', 'json', 'yml', 'yaml', 'xml', 'csv',
    'sh', 'bash', 'zsh', 'fish',
    'py', 'rb', 'js', 'ts', 'jsx', 'tsx',
    'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp',
    'html', 'css', 'scss', 'less',
    'conf', 'cfg', 'ini', 'toml',
    'log', 'env', 'gitignore', 'dockerignore',
    'sql', 'graphql', 'proto'
  ]
  const ext = getFileExtension(filename)
  return textExtensions.includes(ext)
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
