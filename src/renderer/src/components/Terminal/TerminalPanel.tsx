import React, { useEffect, useRef, useCallback } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { SearchAddon } from 'xterm-addon-search'
import { useTerminalStore } from '../../store/terminalStore'
import { useConnectionStore } from '../../store/connectionStore'
import { useSettingsStore } from '../../store/settingsStore'

interface TerminalInstance {
  terminal: Terminal
  fitAddon: FitAddon
  searchAddon: SearchAddon
  connectionId: string
}

export function TerminalPanel() {
  const { tabs, activeTabId } = useTerminalStore()
  const { connectionStatuses } = useConnectionStore()
  const { settings } = useSettingsStore()
  const terminalsRef = useRef<Map<string, TerminalInstance>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  const createTerminal = useCallback((tabId: string, connectionId: string) => {
    if (terminalsRef.current.has(tabId)) return

    const terminal = new Terminal({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      cursorStyle: settings.cursorStyle,
      cursorBlink: settings.cursorBlink,
      scrollback: settings.scrollback,
      theme: {
        background: '#11111b',
        foreground: '#cdd6f4',
        cursor: '#f5e0dc',
        cursorAccent: '#11111b',
        selectionBackground: '#45475a',
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#94e2d5',
        white: '#bac2de',
        brightBlack: '#585b70',
        brightRed: '#f38ba8',
        brightGreen: '#a6e3a1',
        brightYellow: '#f9e2af',
        brightBlue: '#89b4fa',
        brightMagenta: '#cba6f7',
        brightCyan: '#94e2d5',
        brightWhite: '#a6adc8'
      },
      allowTransparency: true,
      convertEol: true
    })

    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(searchAddon)
    terminal.loadAddon(webLinksAddon)

    terminal.onData((data) => {
      window.api.ssh.write(connectionId, data)
    })

    terminal.onResize(({ cols, rows }) => {
      window.api.ssh.resize(connectionId, cols, rows)
    })

    terminalsRef.current.set(tabId, {
      terminal,
      fitAddon,
      searchAddon,
      connectionId
    })

    return terminal
  }, [settings])

  useEffect(() => {
    const unsubData = window.api.ssh.onData((id, data) => {
      terminalsRef.current.forEach((inst) => {
        if (inst.connectionId === id) {
          inst.terminal.write(data)
        }
      })
    })

    return () => {
      unsubData()
    }
  }, [])

  useEffect(() => {
    if (!activeTabId || !containerRef.current) return

    let instance = terminalsRef.current.get(activeTabId)
    if (!instance) {
      const tab = tabs.find((t) => t.id === activeTabId)
      if (!tab) return

      const term = createTerminal(activeTabId, tab.connectionId)
      if (!term) return
      instance = terminalsRef.current.get(activeTabId)!
    }

    const container = containerRef.current
    container.innerHTML = ''

    const termEl = document.createElement('div')
    termEl.style.width = '100%'
    termEl.style.height = '100%'
    container.appendChild(termEl)

    instance.terminal.open(termEl)

    requestAnimationFrame(() => {
      instance!.fitAddon.fit()
      instance!.terminal.focus()
    })

    const observer = new ResizeObserver(() => {
      instance!.fitAddon.fit()
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [activeTabId, tabs])

  useEffect(() => {
    return () => {
      terminalsRef.current.forEach((inst) => {
        inst.terminal.dispose()
      })
      terminalsRef.current.clear()
    }
  }, [])

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-terminal-bg">
        <div className="text-center text-sidebar-muted">
          <svg className="w-20 h-20 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">选择或新建一个 SSH 连接</p>
          <p className="text-sm mt-2">在左侧面板中选择服务器开始连接</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-terminal-bg">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
