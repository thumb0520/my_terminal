import React from 'react'
import { useTerminalStore } from '../../store/terminalStore'
import { useConnectionStore } from '../../store/connectionStore'

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab, addLocalTab } = useTerminalStore()
  const { connectionStatuses } = useConnectionStore()

  const getStatusColor = (tab: { connectionId: string; type: 'local' | 'ssh' }) => {
    if (tab.type === 'local') {
      return 'bg-accent-green'
    }
    const status = connectionStatuses[tab.connectionId]
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
    <div className="flex items-end bg-sidebar-bg border-b border-terminal-border overflow-x-auto px-2">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-item group flex items-center gap-2 cursor-pointer min-w-[120px] max-w-[200px] ${
            activeTabId === tab.id ? 'active' : ''
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <div className={`w-2 h-2 rounded-full ${getStatusColor(tab)}`} />
          <span className="text-sm text-sidebar-text truncate flex-1">{tab.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeTab(tab.id)
            }}
            className="p-0.5 hover:bg-sidebar-hover rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-3 h-3 text-sidebar-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={addLocalTab}
        className="ml-1 mb-1 p-1.5 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover rounded-lg transition-colors flex-shrink-0"
        title="新建本地终端"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
