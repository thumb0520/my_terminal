import React, { useEffect, useRef, useCallback } from 'react'

interface CommandAutocompleteProps {
  suggestions: string[]
  selectedIndex: number
  position: { x: number; y: number }
  visible: boolean
  onSelect: (command: string) => void
  onClose: () => void
}

export function CommandAutocomplete({
  suggestions,
  selectedIndex,
  position,
  visible,
  onSelect,
  onClose
}: CommandAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)

  // 滚动到选中项
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex])

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.command-autocomplete')) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible, onClose])

  if (!visible || suggestions.length === 0) return null

  return (
    <div
      className="command-autocomplete"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
    >
      <div
        ref={listRef}
        className="bg-sidebar-bg border border-terminal-border rounded-lg shadow-lg overflow-hidden max-h-[300px] overflow-y-auto"
        style={{ minWidth: '300px', maxWidth: '500px' }}
      >
        <div className="px-3 py-1.5 text-xs text-sidebar-muted border-b border-terminal-border bg-surface">
          命令历史
        </div>
        {suggestions.map((cmd, index) => (
          <div
            key={`${cmd}-${index}`}
            ref={index === selectedIndex ? selectedRef : null}
            className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${
              index === selectedIndex
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'text-sidebar-text hover:bg-sidebar-hover'
            }`}
            onClick={() => onSelect(cmd)}
            onMouseEnter={() => {}}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate font-mono">{cmd}</span>
          </div>
        ))}
        <div className="px-3 py-1.5 text-xs text-sidebar-muted border-t border-terminal-border bg-surface">
          <span className="opacity-75">↑↓</span> 导航 <span className="opacity-75 ml-2">Tab/Enter</span> 选择 <span className="opacity-75 ml-2">Esc</span> 取消
        </div>
      </div>
    </div>
  )
}
