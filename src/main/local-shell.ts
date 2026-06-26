import { EventEmitter } from 'events'
import * as pty from 'node-pty'
import { homedir } from 'os'

interface LocalShellSession {
  pty: pty.IPty
  id: string
}

export class LocalShellManager extends EventEmitter {
  private sessions: Map<string, LocalShellSession> = new Map()

  create(id: string, options?: { cols?: number; rows?: number }): boolean {
    if (this.sessions.has(id)) return true

    const shell = process.env.SHELL || '/bin/zsh'
    const cols = options?.cols || 120
    const rows = options?.rows || 40

    try {
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: homedir(),
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor'
        }
      })

      this.sessions.set(id, { pty: ptyProcess, id })

      ptyProcess.onData((data: string) => {
        console.log('[LocalShell] onData:', data.substring(0, 50))
        this.emit('data', id, data)
      })

      ptyProcess.onExit(({ exitCode }) => {
        this.sessions.delete(id)
        this.emit('disconnected', id, exitCode)
      })

      this.emit('connected', id)
      return true
    } catch (err: any) {
      this.emit('error', id, err.message)
      return false
    }
  }

  write(id: string, data: string): void {
    const session = this.sessions.get(id)
    if (session) {
      session.pty.write(data)
    }
  }

  resize(id: string, cols: number, rows: number): void {
    const session = this.sessions.get(id)
    if (session) {
      session.pty.resize(cols, rows)
    }
  }

  kill(id: string): void {
    const session = this.sessions.get(id)
    if (session) {
      session.pty.kill()
      this.sessions.delete(id)
    }
  }

  killAll(): void {
    for (const [id] of this.sessions) {
      this.kill(id)
    }
  }

  hasSession(id: string): boolean {
    return this.sessions.has(id)
  }
}
