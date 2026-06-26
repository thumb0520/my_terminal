import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { SearchAddon } from 'xterm-addon-search'
import { useSettingsStore } from '../store/settingsStore'

interface UseTerminalOptions {
  connectionId: string
  onData?: (data: string) => void
  onResize?: (cols: number, rows: number) => void
}

export function useTerminal({ connectionId, onData, onResize }: UseTerminalOptions) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const { settings } = useSettingsStore()

  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
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
    const webLinksAddon = new WebLinksAddon()
    const searchAddon = new SearchAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.loadAddon(searchAddon)

    term.open(terminalRef.current)
    fitAddon.fit()

    term.onData((data) => {
      onData?.(data)
    })

    term.onResize(({ cols, rows }) => {
      onResize?.(cols, rows)
    })

    termRef.current = term
    fitAddonRef.current = fitAddon
    searchAddonRef.current = searchAddon

    const observer = new ResizeObserver(() => {
      fitAddon.fit()
    })
    observer.observe(terminalRef.current)

    return () => {
      observer.disconnect()
      term.dispose()
    }
  }, [connectionId])

  const write = useCallback((data: string) => {
    termRef.current?.write(data)
  }, [])

  const writeln = useCallback((data: string) => {
    termRef.current?.writeln(data)
  }, [])

  const clear = useCallback(() => {
    termRef.current?.clear()
  }, [])

  const focus = useCallback(() => {
    termRef.current?.focus()
  }, [])

  const search = useCallback((text: string) => {
    searchAddonRef.current?.findNext(text)
  }, [])

  const searchPrevious = useCallback((text: string) => {
    searchAddonRef.current?.findPrevious(text)
  }, [])

  const fit = useCallback(() => {
    fitAddonRef.current?.fit()
  }, [])

  return {
    terminalRef,
    term: termRef,
    write,
    writeln,
    clear,
    focus,
    search,
    searchPrevious,
    fit,
    cols: termRef.current?.cols || 120,
    rows: termRef.current?.rows || 40
  }
}
