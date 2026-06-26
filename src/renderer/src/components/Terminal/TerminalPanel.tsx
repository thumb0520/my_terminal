import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { SearchAddon } from 'xterm-addon-search'
import { useTerminalStore } from '../../store/terminalStore'
import { useConnectionStore } from '../../store/connectionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useCommandHistoryStore } from '../../store/commandHistoryStore'
import { CommandAutocomplete } from './CommandAutocomplete'

// 终端配色方案
function getTerminalTheme(appTheme: string) {
  const darkTheme = {
    background: '#11111b', foreground: '#cdd6f4', cursor: '#f5e0dc',
    cursorAccent: '#11111b', selectionBackground: '#45475a',
    black: '#45475a', red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af',
    blue: '#89b4fa', magenta: '#cba6f7', cyan: '#94e2d5', white: '#bac2de',
    brightBlack: '#585b70', brightRed: '#f38ba8', brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af', brightBlue: '#89b4fa', brightMagenta: '#cba6f7',
    brightCyan: '#94e2d5', brightWhite: '#a6adc8'
  }

  const lightTheme = {
    background: '#eff1f5', foreground: '#4c4f69', cursor: '#dc8a78',
    cursorAccent: '#eff1f5', selectionBackground: '#bcc0cc',
    black: '#5c5f77', red: '#d20f39', green: '#40a02b', yellow: '#df8e1d',
    blue: '#1e66f5', magenta: '#8839ef', cyan: '#179299', white: '#7c7f93',
    brightBlack: '#6c6f85', brightRed: '#d20f39', brightGreen: '#40a02b',
    brightYellow: '#df8e1d', brightBlue: '#1e66f5', brightMagenta: '#8839ef',
    brightCyan: '#179299', brightWhite: '#4c4f69'
  }

  return appTheme === 'light' ? lightTheme : darkTheme
}

const LOCAL_TERMINAL_ID = 'local-terminal'

export function TerminalPanel() {
  const { tabs, activeTabId } = useTerminalStore()
  const { settings } = useSettingsStore()
  const { loadHistory, addCommand, getCompletions } = useCommandHistoryStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const unsubsRef = useRef<(() => void)[]>([])
  const currentShellIdRef = useRef<string>(LOCAL_TERMINAL_ID)

  // 命令缓冲区和自动补全状态 - 全部用 ref，避免触发重渲染
  const commandBufferRef = useRef<string>('')
  const autocompleteVisibleRef = useRef(false)
  const autocompleteSuggestionsRef = useRef<string[]>([])
  const autocompleteIndexRef = useRef(0)
  const autocompletePositionRef = useRef({ x: 0, y: 0 })

  // 用于触发 UI 更新的状态
  const [, forceUpdate] = useState(0)

  // 加载命令历史
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // 计算自动补全位置
  const getAutocompletePosition = useCallback(() => {
    if (!termRef.current || !containerRef.current) return { x: 0, y: 0 }

    const terminal = termRef.current
    const container = containerRef.current
    const rect = container.getBoundingClientRect()

    const cursorX = terminal.buffer.active.cursorX
    const cursorY = terminal.buffer.active.cursorY

    const cellWidth = terminal.element?.querySelector('.xterm-rows')?.querySelector('div')?.offsetWidth || 8
    const cellHeight = terminal.element?.querySelector('.xterm-rows')?.querySelector('div')?.offsetHeight || 16

    const padding = 8

    return {
      x: rect.left + padding + cursorX * cellWidth,
      y: rect.top + padding + (cursorY + 1) * cellHeight
    }
  }, [])

  // 更新自动补全建议 - 不使用 setState
  const updateAutocomplete = useCallback((buffer: string) => {
    if (!buffer) {
      autocompleteVisibleRef.current = false
      forceUpdate(n => n + 1)
      return
    }

    const suggestions = getCompletions(buffer)
    if (suggestions.length > 0) {
      autocompleteSuggestionsRef.current = suggestions
      autocompleteIndexRef.current = 0
      autocompletePositionRef.current = getAutocompletePosition()
      autocompleteVisibleRef.current = true
    } else {
      autocompleteVisibleRef.current = false
    }
    forceUpdate(n => n + 1)
  }, [getCompletions, getAutocompletePosition])

  // 选择自动补全建议
  const handleAutocompleteSelect = useCallback((command: string) => {
    if (!termRef.current) return

    const terminal = termRef.current
    const currentBuffer = commandBufferRef.current

    for (let i = 0; i < currentBuffer.length; i++) {
      terminal.write('\x7f')
    }

    terminal.write(command)
    commandBufferRef.current = command
    autocompleteVisibleRef.current = false
    forceUpdate(n => n + 1)
  }, [])

  // 关闭自动补全
  const handleAutocompleteClose = useCallback(() => {
    autocompleteVisibleRef.current = false
    forceUpdate(n => n + 1)
  }, [])

  // 清理函数
  const cleanup = useCallback(() => {
    unsubsRef.current.forEach(unsub => unsub())
    unsubsRef.current = []
    if (termRef.current) {
      termRef.current.dispose()
      termRef.current = null
    }
    fitRef.current = null
    commandBufferRef.current = ''
    autocompleteVisibleRef.current = false
    window.api.localShell.kill(currentShellIdRef.current)
  }, [])

  // 创建终端
  const setupTerminal = useCallback((container: HTMLDivElement): Promise<{ terminal: Terminal; fitAddon: FitAddon; observer: ResizeObserver }> => {
    return new Promise((resolve) => {
      cleanup()

      const terminal = new Terminal({
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        cursorStyle: settings.cursorStyle,
        cursorBlink: settings.cursorBlink,
        scrollback: settings.scrollback,
        theme: getTerminalTheme(settings.theme),
        allowTransparency: true,
        convertEol: true,
        screenReaderMode: false,
        macOptionIsMeta: true,
        allowProposedApi: true
      })

      const fitAddon = new FitAddon()
      const webLinksAddon = new WebLinksAddon()
      const searchAddon = new SearchAddon()

      terminal.loadAddon(fitAddon)
      terminal.loadAddon(webLinksAddon)
      terminal.loadAddon(searchAddon)

      termRef.current = terminal
      fitRef.current = fitAddon

      const openTerminal = () => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          terminal.open(container)

          setTimeout(() => {
            try {
              fitAddon.fit()
            } catch (e) {
              console.warn('[Terminal] fitAddon.fit() error:', e)
            }
            terminal.focus()
            resolve({ terminal, fitAddon, observer })
          }, 100)
        } else {
          requestAnimationFrame(openTerminal)
        }
      }

      const observer = new ResizeObserver(() => {
        try {
          fitAddon.fit()
        } catch (e) {
          // 忽略 fit 错误
        }
      })
      observer.observe(container)

      openTerminal()
    })
  }, [settings, cleanup])

  // 处理终端输入 - 稳定的回调，不依赖任何会变化的 state
  const handleTerminalDataRef = useRef<(data: string) => void>(() => {})

  useEffect(() => {
    handleTerminalDataRef.current = (data: string) => {
      const char = data

      if (char === '\r' || char === '\n') {
        const cmd = commandBufferRef.current.trim()
        if (cmd) {
          addCommand(cmd)
        }
        commandBufferRef.current = ''
        autocompleteVisibleRef.current = false
        forceUpdate(n => n + 1)
      } else if (char === '\x7f') {
        commandBufferRef.current = commandBufferRef.current.slice(0, -1)
        updateAutocomplete(commandBufferRef.current)
      } else if (char === '\x1b[A' || char === '\x1b[B') {
        if (autocompleteVisibleRef.current) {
          if (char === '\x1b[A') {
            autocompleteIndexRef.current = Math.max(0, autocompleteIndexRef.current - 1)
          } else {
            autocompleteIndexRef.current = Math.min(
              autocompleteSuggestionsRef.current.length - 1,
              autocompleteIndexRef.current + 1
            )
          }
          forceUpdate(n => n + 1)
          return
        }
      } else if (char === '\x1b[C' || char === '\x1b[D') {
        autocompleteVisibleRef.current = false
        forceUpdate(n => n + 1)
      } else if (char === '\t') {
        if (autocompleteVisibleRef.current && autocompleteSuggestionsRef.current.length > 0) {
          handleAutocompleteSelect(autocompleteSuggestionsRef.current[autocompleteIndexRef.current])
          return
        }
      } else if (char === '\x1b') {
        if (autocompleteVisibleRef.current) {
          autocompleteVisibleRef.current = false
          forceUpdate(n => n + 1)
          return
        }
      } else if (char >= ' ' && char <= '~') {
        commandBufferRef.current += char
        updateAutocomplete(commandBufferRef.current)
      }
    }
  }, [addCommand, updateAutocomplete, handleAutocompleteSelect])

  // 稳定的 onData 回调，引用 ref 而非直接依赖 state
  const handleTerminalData = useCallback((data: string) => {
    handleTerminalDataRef.current(data)
  }, [])

  // 初始化本地终端
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (tabs.length > 0 && activeTab && activeTab.type === 'ssh') return
    if (!containerRef.current) return

    const localId = activeTab ? activeTab.connectionId : LOCAL_TERMINAL_ID
    currentShellIdRef.current = localId

    let observer: ResizeObserver | null = null

    setupTerminal(containerRef.current).then(({ terminal, fitAddon, observer: obs }) => {
      observer = obs

      const unsubData = window.api.localShell.onData((id, data) => {
        if (id === localId) {
          console.log('[Terminal] Received data from shell:', data.substring(0, 50))
          terminal.write(data)
        }
      })

      unsubsRef.current.push(unsubData)

      terminal.onData((data) => {
        console.log('[Terminal] onData:', JSON.stringify(data))
        handleTerminalData(data)
        window.api.localShell.write(localId, data)
      })

      terminal.onResize(({ cols, rows }) => {
        window.api.localShell.resize(localId, cols, rows)
      })

      window.api.localShell.create(localId, terminal.cols, terminal.rows)
    })

    return () => {
      observer?.disconnect()
      cleanup()
    }
  }, [tabs, activeTabId, setupTerminal, handleTerminalData])

  // SSH 终端
  useEffect(() => {
    if (tabs.length === 0 || !activeTabId || !containerRef.current) return

    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab || tab.type !== 'ssh') return

    let observer: ResizeObserver | null = null

    setupTerminal(containerRef.current).then(({ terminal, fitAddon, observer: obs }) => {
      observer = obs

      const unsubData = window.api.ssh.onData((id, data) => {
        if (id === tab.connectionId) {
          terminal.write(data)
        }
      })

      unsubsRef.current.push(unsubData)

      terminal.onData((data) => {
        handleTerminalData(data)
        window.api.ssh.write(tab.connectionId, data)
      })

      terminal.onResize(({ cols, rows }) => {
        window.api.ssh.resize(tab.connectionId, cols, rows)
      })
    })

    return () => {
      observer?.disconnect()
      cleanup()
    }
  }, [activeTabId, tabs, setupTerminal, handleTerminalData])

  // 主题变化时更新终端
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = getTerminalTheme(settings.theme)
    }
  }, [settings.theme])

  // 点击容器时聚焦终端
  const handleContainerClick = useCallback(() => {
    if (termRef.current) {
      termRef.current.focus()
      const textarea = containerRef.current?.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
      }
    }
  }, [])

  // 确保终端初始聚焦
  useEffect(() => {
    const timer = setTimeout(() => {
      if (termRef.current) {
        termRef.current.focus()
        const textarea = containerRef.current?.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement
        if (textarea) {
          textarea.focus()
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [tabs.length, activeTabId])

  // 全局键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (termRef.current) {
        const activeElement = document.activeElement
        const tagName = activeElement?.tagName
        const isInputFocused = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'BUTTON'

        if (!isInputFocused || activeElement?.classList.contains('xterm-helper-textarea')) {
          termRef.current.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex-1 bg-terminal-bg relative" onClick={handleContainerClick}>
      <div ref={containerRef} className="w-full h-full" />
      <CommandAutocomplete
        suggestions={autocompleteSuggestionsRef.current}
        selectedIndex={autocompleteIndexRef.current}
        position={autocompletePositionRef.current}
        visible={autocompleteVisibleRef.current}
        onSelect={handleAutocompleteSelect}
        onClose={handleAutocompleteClose}
      />
    </div>
  )
}
