import React from 'react'
import { useConnectionStore } from '../../store/connectionStore'
import { useTerminalStore } from '../../store/terminalStore'

export function StatusBar() {
  const { connections, activeConnectionId, connectionStatuses } = useConnectionStore()
  const { tabs, activeTabId } = useTerminalStore()

  const activeConnection = connections.find((c) => c.id === activeConnectionId)
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const status = activeConnectionId ? connectionStatuses[activeConnectionId] : null

  const statusText = {
    connected: '已连接',
    connecting: '连接中...',
    disconnected: '未连接',
    error: '连接错误'
  }

  const statusColor = {
    connected: 'text-accent-green',
    connecting: 'text-accent-yellow',
    disconnected: 'text-sidebar-muted',
    error: 'text-accent-red'
  }

  return (
    <div className="h-6 bg-sidebar-bg border-t border-terminal-border flex items-center px-4 text-xs text-sidebar-muted">
      <div className="flex items-center gap-4">
        {activeConnection && (
          <>
            <span>
              连接: <span className="text-sidebar-text">{activeConnection.name}</span>
            </span>
            <span>
              用户: <span className="text-sidebar-text">{activeConnection.username}</span>
            </span>
            <span>
              主机: <span className="text-sidebar-text">{activeConnection.host}:{activeConnection.port}</span>
            </span>
          </>
        )}
        <span>
          状态: <span className={status ? statusColor[status] : ''}>{status ? statusText[status] : '-'}</span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span>编码: UTF-8</span>
        <span>标签: {tabs.length}</span>
      </div>
    </div>
  )
}
