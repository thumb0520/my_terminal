import { exec } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync, readFileSync, mkdirSync, writeFileSync, unlinkSync } from 'fs'
import { randomUUID } from 'crypto'
import Store from 'electron-store'

interface StoredKey {
  id: string
  name: string
  type: string
  publicKey: string
  privateKeyPath: string
  createdAt: number
}

export class KeyManager {
  private store: Store<{ keys: StoredKey[] }>
  private sshDir: string

  constructor() {
    this.sshDir = join(homedir(), '.ssh')
    if (!existsSync(this.sshDir)) {
      mkdirSync(this.sshDir, { mode: 0o700 })
    }

    this.store = new Store<{ keys: StoredKey[] }>({
      defaults: { keys: [] }
    })
  }

  async list(): Promise<StoredKey[]> {
    return this.store.get('keys', [])
  }

  async generate(name: string, type: 'rsa' | 'ed25519' | 'ecdsa' = 'ed25519'): Promise<StoredKey> {
    const id = randomUUID()
    const keyPath = join(this.sshDir, `id_${type}_${id}`)

    return new Promise((resolve, reject) => {
      const bits = type === 'rsa' ? '-b 4096' : ''
      exec(`ssh-keygen -t ${type} ${bits} -f "${keyPath}" -N "" -C "${name}"`, (err) => {
        if (err) return reject(err)

        const publicKey = readFileSync(`${keyPath}.pub`, 'utf-8').trim()
        const key: StoredKey = {
          id,
          name,
          type,
          publicKey,
          privateKeyPath: keyPath,
          createdAt: Date.now()
        }

        const keys = this.store.get('keys', [])
        keys.push(key)
        this.store.set('keys', keys)

        resolve(key)
      })
    })
  }

  async import(name: string, privateKeyPath: string): Promise<StoredKey> {
    const id = randomUUID()
    const destPath = join(this.sshDir, `imported_${id}`)

    const content = readFileSync(privateKeyPath, 'utf-8')
    writeFileSync(destPath, content, { mode: 0o600 })

    let publicKey = ''
    try {
      const { execSync } = require('child_process')
      publicKey = execSync(`ssh-keygen -y -f "${destPath}"`).toString().trim()
    } catch {
      publicKey = '(unable to extract public key)'
    }

    const key: StoredKey = {
      id,
      name,
      type: content.includes('OPENSSH PRIVATE KEY') ? 'ed25519' : 'rsa',
      publicKey,
      privateKeyPath: destPath,
      createdAt: Date.now()
    }

    const keys = this.store.get('keys', [])
    keys.push(key)
    this.store.set('keys', keys)

    return key
  }

  async deleteKey(id: string): Promise<void> {
    const keys = this.store.get('keys', [])
    const key = keys.find(k => k.id === id)
    if (key) {
      try {
        if (existsSync(key.privateKeyPath)) unlinkSync(key.privateKeyPath)
        if (existsSync(`${key.privateKeyPath}.pub`)) unlinkSync(`${key.privateKeyPath}.pub`)
      } catch {}
      this.store.set('keys', keys.filter(k => k.id !== id))
    }
  }

  async getPublicKey(id: string): Promise<string> {
    const keys = this.store.get('keys', [])
    const key = keys.find(k => k.id === id)
    return key?.publicKey || ''
  }
}
