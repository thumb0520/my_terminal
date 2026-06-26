import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { SearchAddon } from 'xterm-addon-search'
import { useTerminalStore } from '../../store/terminalStore'
import { useConnectionStore } from '../../store/connectionStore'
import { useSettingsStore } from '../../store/settingsStore'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const unsubsRef = useRef<(() => void)[]>([])

  // 清理函数
  const cleanup = useCallback(() => {
    unsubsRef.current.forEach(unsub => unsub())
    unsubsRef.current = []
    if (termRef.current) {
      termRef.current.dispose()
      termRef.current = null
    }
    fitRef.current = null
    window.api.localShell.kill(LOCAL_TERMINAL_ID)
  }, [])

  // 创建终端 - 返回一个 Promise，确保终端完全就绪后再返回
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
        // 确保键盘事件正常工作
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

      // 确保容器有尺寸后再打开终端
      const openTerminal = () => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          terminal.open(container)

          // 延迟调整大小和聚焦，然后 resolve
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
          // 容器还没有尺寸，等待下一帧
          requestAnimationFrame(openTerminal)
        }
      }

      // 监听容器大小变化
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

  // 初始化本地终端
  useEffect(() => {
    if (tabs.length > 0 || !containerRef.current) return

    let observer: ResizeObserver | null = null

    setupTerminal(containerRef.current).then(({ terminal, fitAddon, observer: obs }) => {
      observer = obs

      // 监听本地 shell 输出
      const unsubData = window.api.localShell.onData((id, data) => {
        if (id === LOCAL_TERMINAL_ID) {
          console.log('[Terminal] Received data from shell:', data.substring(0, 50))
          terminal.write(data)
        }
      })

      unsubsRef.current.push(unsubData)

      // 发送输入到本地 shell
      terminal.onData((data) => {
        console.log('[Terminal] onData:', JSON.stringify(data))
        window.api.localShell.write(LOCAL_TERMINAL_ID, data)
      })

      // 本地终端大小调整
      terminal.onResize(({ cols, rows }) => {
        window.api.localShell.resize(LOCAL_TERMINAL_ID, cols, rows)
      })

      // 创建本地 shell - 终端就绪后再创建
      window.api.localShell.create(LOCAL_TERMINAL_ID, terminal.cols, terminal.rows)
    })

    return () => {
      observer?.disconnect()
      cleanup()
    }
  }, [tabs.length, setupTerminal])

  // SSH 终端
  useEffect(() => {
    if (tabs.length === 0 || !activeTabId || !containerRef.current) return

    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab) return

    let observer: ResizeObserver | null = null

    setupTerminal(containerRef.current).then(({ terminal, fitAddon, observer: obs }) => {
      observer = obs

      // 监听 SSH 输出
      const unsubData = window.api.ssh.onData((id, data) => {
        if (id === tab.connectionId) {
          terminal.write(data)
        }
      })

      unsubsRef.current.push(unsubData)

      // 发送输入到 SSH
      terminal.onData((data) => {
        window.api.ssh.write(tab.connectionId, data)
      })

      // SSH 终端大小调整
      terminal.onResize(({ cols, rows }) => {
        window.api.ssh.resize(tab.connectionId, cols, rows)
      })
    })

    return () => {
      observer?.disconnect()
      cleanup()
    }
  }, [activeTabId, tabs, setupTerminal])

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
      // 确保 textarea 也获得焦点
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

  // 全局键盘事件处理 - 确保终端能接收输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果终端存在且当前焦点不在输入框上
      if (termRef.current) {
        const activeElement = document.activeElement
        const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'

        // 如果没有输入框获得焦点，将焦点转移到终端
        if (!isInputFocused || activeElement?.classList.contains('xterm-helper-textarea')) {
          termRef.current.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex-1 bg-terminal-bg" onClick={handleContainerClick}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
