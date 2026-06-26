import React, { useState, useEffect } from 'react'
import { ConnectionList } from './components/Sidebar/ConnectionList'
import { TerminalPanel } from './components/Terminal/TerminalPanel'
import { TabBar } from './components/Terminal/TabBar'
import { StatusBar } from './components/Terminal/StatusBar'
import { FileBrowser } from './components/FileManager/FileBrowser'
import { SSHKeyManager } from './components/Settings/SSHKeyManager'
import { ThemeSettings } from './components/Settings/ThemeSettings'
import { useConnectionStore } from './store/connectionStore'
import { useTerminalStore } from './store/terminalStore'
import { useSettingsStore } from './store/settingsStore'

type RightPanel = 'terminal' | 'files' | 'keys' | 'settings'

export default function App() {
  const { activeConnectionId, connectionStatuses } = useConnectionStore()
  const { tabs, addLocalTab } = useTerminalStore()
  const { settings, loadSettings, sidebarWidth, setSidebarWidth } = useSettingsStore()
  const [rightPanel, setRightPanel] = useState<RightPanel>('terminal')
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  // 应用主题到 document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
    // 同时更新 Electron 窗口背景色
    document.body.style.backgroundColor = settings.theme === 'light' ? '#eff1f5' : '#11111b'
    // 通知主进程更新窗口背景
    window.api.window.setTheme(settings.theme)
  }, [settings.theme])

  useEffect(() => {
    if (activeConnectionId && connectionStatuses[activeConnectionId] === 'connected') {
      setRightPanel('terminal')
    }
  }, [activeConnectionId, connectionStatuses])


  // 监听主进程菜单事件
  useEffect(() => {
    const unsubscribe = window.api.menu.onNewLocalTerminal(() => {
      addLocalTab()
      setRightPanel('terminal')
    })
    return () => {
      unsubscribe()
    }
  }, [addLocalTab])

  const handleMouseDown = () => {
    setIsResizing(true)
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(500, e.clientX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <div className="flex flex-col h-screen bg-terminal-bg">
      {/* Title bar drag region - pl-20 for macOS traffic lights */}
      <div className="h-12 drag-region flex items-center pl-20 pr-4 bg-sidebar-bg border-b border-terminal-border">
        <div className="flex items-center gap-3 no-drag">
          <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          <span className="text-sm font-semibold text-sidebar-text">SSH Manager</span>
        </div>
        <div className="ml-auto flex items-center gap-2 no-drag">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRightPanel('terminal')}
            className={`p-2 rounded-lg transition-colors ${
              rightPanel === 'terminal' ? 'bg-sidebar-active text-accent-blue' : 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
            }`}
            title="终端"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRightPanel('files')}
            className={`p-2 rounded-lg transition-colors ${
              rightPanel === 'files' ? 'bg-sidebar-active text-accent-blue' : 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
            }`}
            title="文件管理"
            disabled={!activeConnectionId || connectionStatuses[activeConnectionId] !== 'connected'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
          <div className="w-px h-6 bg-sidebar-hover mx-1" />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRightPanel('keys')}
            className={`p-2 rounded-lg transition-colors ${
              rightPanel === 'keys' ? 'bg-sidebar-active text-accent-blue' : 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
            }`}
            title="密钥管理"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRightPanel('settings')}
            className={`p-2 rounded-lg transition-colors ${
              rightPanel === 'settings' ? 'bg-sidebar-active text-accent-blue' : 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
            }`}
            title="设置"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div
          className="flex-shrink-0 bg-sidebar-bg border-r border-terminal-border overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          <ConnectionList />
        </div>

        {/* Resize handle */}
        <div
          className="w-1 hover:w-1.5 bg-transparent hover:bg-accent-blue cursor-col-resize transition-all flex-shrink-0"
          onMouseDown={handleMouseDown}
        />

        {/* Right panel */}
        <div className="flex-1 relative overflow-hidden">
          {/* 终端面板 - 始终挂载，用绝对定位 */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden"
            style={{
              visibility: rightPanel === 'terminal' ? 'visible' : 'hidden',
              pointerEvents: rightPanel === 'terminal' ? 'auto' : 'none',
              zIndex: rightPanel === 'terminal' ? 1 : 0
            }}
          >
            <TabBar />
            <TerminalPanel />
          </div>

          {/* 其他面板覆盖在上面 */}
          {rightPanel === 'files' && activeConnectionId && (
            <div className="absolute inset-0 z-10">
              <FileBrowser connectionId={activeConnectionId} />
            </div>
          )}

          {rightPanel === 'keys' && (
            <div className="absolute inset-0 z-10 overflow-y-auto p-6 bg-terminal-bg">
              <SSHKeyManager />
            </div>
          )}

          {rightPanel === 'settings' && (
            <div className="absolute inset-0 z-10 overflow-y-auto p-6 bg-terminal-bg">
              <ThemeSettings />
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Resize overlay */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  )
}
