import React from 'react'
import { useTerminalStore } from '../../store/terminalStore'
import { useConnectionStore } from '../../store/connectionStore'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTerminalStore()
  const { connectionStatuses } = useConnectionStore()

  const getStatusColor = (connectionId: string) => {
    const status = connectionStatuses[connectionId]
    switch (status) {
      case 'connected':
        return 'bg-accent-green'
      case 'connecting':
        return 'bg-accent-yellow'
      case 'error':
        return 'bg-accent-red'
      default:
        return 'bg-sidebar-muted'
    }
  }

  if (tabs.length === 0) return null

  return (
    <div className="flex bg-sidebar-bg border-b border-terminal-border overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-item flex items-center gap-2 px-4 py-2 cursor-pointer min-w-[120px] max-w-[200px] ${
            activeTabId === tab.id ? 'active' : ''
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <div className={`w-2 h-2 rounded-full ${getStatusColor(tab.connectionId)}`} />
          <span className="text-sm text-sidebar-text truncate flex-1">{tab.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeTab(tab.id)
            }}
            className="p-0.5 hover:bg-sidebar-hover rounded opacity-0 group-hover:opacity-100"
          >
            <svg className="w-3 h-3 text-sidebar-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
