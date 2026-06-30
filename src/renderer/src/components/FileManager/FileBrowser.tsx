import React, { useState, useEffect, useCallback } from 'react'
import { FileItem } from '../../types'
import { useConnectionStore } from '../../store/connectionStore'

interface FileBrowserProps {
  connectionId: string
}

export function FileBrowser({ connectionId }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('~')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const { connectionStatuses } = useConnectionStore()

  const loadFiles = useCallback(async (path: string) => {
    if (connectionStatuses[connectionId] !== 'connected') return

    setLoading(true)
    setError(null)
    try {
      const result = await window.api.sftp.list(connectionId, path)
      setFiles(result.items.sort((a: FileItem, b: FileItem) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1
        if (a.type !== 'directory' && b.type === 'directory') return 1
        return a.name.localeCompare(b.name)
      }))
      setCurrentPath(result.resolvedPath)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [connectionId, connectionStatuses])

  useEffect(() => {
    loadFiles('~')
  }, [connectionId, connectionStatuses[connectionId]])

  const handleNavigate = (path: string) => {
    loadFiles(path)
  }

  const handleGoUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    loadFiles(parentPath)
  }

  const handleDoubleClick = (file: FileItem) => {
    if (file.type === 'directory') {
      handleNavigate(file.path)
    }
  }

  const handleSelect = (path: string, e: React.MouseEvent) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      if (e.metaKey || e.ctrlKey) {
        if (next.has(path)) next.delete(path)
        else next.add(path)
      } else {
        next.clear()
        next.add(path)
      }
      return next
    })
  }

  const handleUpload = async () => {
    const result = await window.api.dialog.openFile({
      properties: ['openFile', 'multiSelections']
    })
    if (!result.canceled) {
      for (const filePath of result.filePaths) {
        try {
          await window.api.sftp.upload(connectionId, filePath, currentPath)
        } catch (err: any) {
          console.error('Upload failed:', err.message)
        }
      }
      loadFiles(currentPath)
    }
  }

  const handleDownload = async (file: FileItem) => {
    const result = await window.api.dialog.saveFile({
      defaultPath: file.name
    })
    if (!result.canceled && result.filePath) {
      try {
        await window.api.sftp.download(connectionId, file.path, result.filePath)
      } catch (err: any) {
        console.error('Download failed:', err.message)
      }
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`确定删除 ${file.name}?`)) return
    try {
      await window.api.sftp.delete(connectionId, file.path)
      loadFiles(currentPath)
    } catch (err: any) {
      console.error('Delete failed:', err.message)
    }
  }

  const handleMkdir = async () => {
    const name = prompt('新建文件夹名称:')
    if (!name) return
    try {
      await window.api.sftp.mkdir(connectionId, `${currentPath}/${name}`)
      loadFiles(currentPath)
    } catch (err: any) {
      console.error('Mkdir failed:', err.message)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      try {
        await window.api.sftp.upload(connectionId, (file as any).path, currentPath)
      } catch (err: any) {
        console.error('Upload failed:', err.message)
      }
    }
    loadFiles(currentPath)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') return '📁'
    if (file.name.endsWith('.sh') || file.name.endsWith('.bash')) return '📜'
    if (file.name.endsWith('.py')) return '🐍'
    if (file.name.endsWith('.js') || file.name.endsWith('.ts')) return '📜'
    if (file.name.endsWith('.json')) return '📋'
    if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) return '⚙️'
    if (file.name.endsWith('.log')) return '📄'
    if (file.name.endsWith('.tar') || file.name.endsWith('.gz') || file.name.endsWith('.zip')) return '📦'
    return '📄'
  }

  return (
    <div
      className="flex flex-col h-full bg-sidebar-bg border-l border-terminal-border"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border">
        <button
          onClick={handleGoUp}
          className="p-1.5 hover:bg-sidebar-hover rounded"
          disabled={currentPath === '/'}
        >
          <svg className="w-4 h-4 text-sidebar-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <div className="flex-1 bg-sidebar-hover rounded px-3 py-1.5 text-sm text-sidebar-text truncate">
          {currentPath}
        </div>
        <button onClick={handleUpload} className="p-1.5 hover:bg-sidebar-hover rounded" title="上传文件">
          <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        <button onClick={handleMkdir} className="p-1.5 hover:bg-sidebar-hover rounded" title="新建文件夹">
          <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sidebar-muted">
            加载中...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-accent-red text-sm px-4 text-center">
            {error}
          </div>
        ) : (
          <div className="py-1">
            {currentPath !== '/' && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-sidebar-hover cursor-pointer"
                onClick={handleGoUp}
              >
                <span>📁</span>
                <span className="text-sm text-sidebar-muted">..</span>
              </div>
            )}
            {files.map((file) => (
              <div
                key={file.path}
                className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer ${
                  selectedFiles.has(file.path)
                    ? 'bg-accent-blue/20'
                    : 'hover:bg-sidebar-hover'
                }`}
                onClick={(e) => handleSelect(file.path, e)}
                onDoubleClick={() => handleDoubleClick(file)}
              >
                <span className="text-sm">{getFileIcon(file)}</span>
                <span className="flex-1 text-sm text-sidebar-text truncate">
                  {file.name}
                </span>
                <span className="text-xs text-sidebar-muted w-16 text-right">
                  {formatSize(file.size)}
                </span>
                <span className="text-xs text-sidebar-muted w-20 text-right">
                  {formatDate(file.modifyTime)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(file)
                    }}
                    className="p-1 hover:bg-sidebar-active rounded"
                    title="下载"
                  >
                    <svg className="w-3.5 h-3.5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(file)
                    }}
                    className="p-1 hover:bg-sidebar-active rounded"
                    title="删除"
                  >
                    <svg className="w-3.5 h-3.5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-terminal-border text-xs text-sidebar-muted">
        {files.length} 个项目 | 已选 {selectedFiles.size} 个
      </div>
    </div>
  )
}
