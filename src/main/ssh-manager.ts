import { Client, ConnectConfig } from 'ssh2'
import { EventEmitter } from 'events'
import { CONNECTION_TIMEOUT, KEEPALIVE_INTERVAL } from '../shared/constants'

interface SSHSession {
  client: Client
  stream: any
  shell: any
}

export class SSHManager extends EventEmitter {
  private sessions: Map<string, SSHSession> = new Map()

  async connect(config: {
    id: string
    host: string
    port: number
    username: string
    authType: 'password' | 'key'
    password?: string
    privateKeyPath?: string
    passphrase?: string
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const client = new Client()
      const connectConfig: ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: CONNECTION_TIMEOUT,
        keepaliveInterval: KEEPALIVE_INTERVAL,
        keepaliveCountMax: 3
      }

      if (config.authType === 'password') {
        connectConfig.password = config.password
      } else {
        const fs = require('fs')
        try {
          connectConfig.privateKey = fs.readFileSync(config.privateKeyPath!)
          if (config.passphrase) {
            connectConfig.passphrase = config.passphrase
          }
        } catch (err) {
          reject(new Error(`Failed to read private key: ${err}`))
          return
        }
      }

      client.on('ready', () => {
        client.shell({ term: 'xterm-256color', cols: 120, rows: 40 }, (err, stream) => {
          if (err) {
            reject(err)
            return
          }

          this.sessions.set(config.id, { client, stream, shell: stream })

          stream.on('data', (data: Buffer) => {
            this.emit('data', config.id, data.toString('utf-8'))
          })

          stream.on('close', () => {
            this.sessions.delete(config.id)
            this.emit('disconnected', config.id)
          })

          stream.stderr.on('data', (data: Buffer) => {
            this.emit('data', config.id, data.toString('utf-8'))
          })

          this.emit('connected', config.id)
          resolve(true)
        })
      })

      client.on('error', (err) => {
        this.emit('error', config.id, err.message)
        reject(err)
      })

      client.on('close', () => {
        this.sessions.delete(config.id)
        this.emit('disconnected', config.id)
      })

      client.connect(connectConfig)
    })
  }

  write(connectionId: string, data: string): void {
    const session = this.sessions.get(connectionId)
    if (session?.stream) {
      session.stream.write(data)
    }
  }

  resize(connectionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(connectionId)
    if (session?.stream) {
      session.stream.setWindow(rows, cols, 0, 0)
    }
  }

  async exec(connectionId: string, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const session = this.sessions.get(connectionId)
      if (!session?.client) {
        reject(new Error('Not connected'))
        return
      }

      session.client.exec(command, (err, stream) => {
        if (err) {
          reject(err)
          return
        }

        let output = ''
        stream.on('data', (data: Buffer) => {
          output += data.toString('utf-8')
        })

        stream.on('close', () => {
          resolve(output)
        })
      })
    })
  }

  async disconnect(connectionId: string): Promise<void> {
    const session = this.sessions.get(connectionId)
    if (session) {
      session.stream?.close()
      session.client.end()
      this.sessions.delete(connectionId)
    }
  }

  disconnectAll(): void {
    for (const [id] of this.sessions) {
      this.disconnect(id)
    }
  }

  isConnected(connectionId: string): boolean {
    return this.sessions.has(connectionId)
  }

  getClient(connectionId: string): Client | undefined {
    return this.sessions.get(connectionId)?.client
  }
}
