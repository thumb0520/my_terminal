import { Client } from 'ssh2'
import { EventEmitter } from 'events'
import { createReadStream, createWriteStream, statSync } from 'fs'
import { basename, join } from 'path'

export class SFTPHandler extends EventEmitter {
  private connections: Map<string, Client> = new Map()
  private homeDirs: Map<string, string> = new Map()

  setConnection(id: string, client: Client): void {
    this.connections.set(id, client)
    // Resolve home directory for this connection
    client.exec('echo $HOME', (err: any, stream: any) => {
      if (!err) {
        let home = ''
        stream.on('data', (data: Buffer) => { home += data.toString() })
        stream.on('close', () => {
          const dir = home.trim()
          if (dir) this.homeDirs.set(id, dir)
        })
      }
    })
  }

  removeConnection(id: string): void {
    this.connections.delete(id)
    this.homeDirs.delete(id)
  }

  private resolvePath(connectionId: string, path: string): string {
    if (path === '~' || path.startsWith('~/')) {
      const home = this.homeDirs.get(connectionId) || '/root'
      return path === '~' ? home : home + path.slice(1)
    }
    return path
  }

  async list(connectionId: string, path: string): Promise<{ items: any[], resolvedPath: string }> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')
    const resolvedPath = this.resolvePath(connectionId, path)

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)

        sftp.readdir(resolvedPath, (err, list) => {
          if (err) return reject(err)

          const items = list.map(item => ({
            name: item.filename,
            path: join(resolvedPath, item.filename),
            type: (item.attrs.mode & 0o170000) === 0o040000 ? 'directory' :
                  (item.attrs.mode & 0o170000) === 0o120000 ? 'symlink' : 'file',
            size: item.attrs.size,
            modifyTime: item.attrs.mtime * 1000,
            permissions: (item.attrs.mode & 0o777).toString(8),
            owner: item.attrs.uid.toString(),
            group: item.attrs.gid.toString()
          }))

          resolve({ items, resolvedPath })
        })
      })
    })
  }

  async upload(connectionId: string, localPath: string, remotePath: string): Promise<void> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')
    const resolvedRemotePath = this.resolvePath(connectionId, remotePath)

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)

        const remoteFilePath = join(resolvedRemotePath, basename(localPath))
        const fileStats = statSync(localPath)
        const readStream = createReadStream(localPath)
        const writeStream = sftp.createWriteStream(remoteFilePath)

        let transferred = 0

        readStream.on('data', (chunk) => {
          transferred += chunk.length
          this.emit('progress', connectionId, {
            filename: basename(localPath),
            direction: 'upload',
            total: fileStats.size,
            transferred,
            status: 'transferring'
          })
        })

        writeStream.on('close', () => {
          this.emit('progress', connectionId, {
            filename: basename(localPath),
            direction: 'upload',
            total: fileStats.size,
            transferred: fileStats.size,
            status: 'completed'
          })
          resolve()
        })

        writeStream.on('error', (err) => {
          this.emit('progress', connectionId, {
            filename: basename(localPath),
            direction: 'upload',
            total: fileStats.size,
            transferred,
            status: 'error',
            error: err.message
          })
          reject(err)
        })

        readStream.pipe(writeStream)
      })
    })
  }

  async download(connectionId: string, remotePath: string, localPath: string): Promise<void> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')
    const resolvedRemotePath = this.resolvePath(connectionId, remotePath)

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)

        sftp.stat(resolvedRemotePath, (err, stats) => {
          if (err) return reject(err)

          const readStream = sftp.createReadStream(resolvedRemotePath)
          const writeStream = createWriteStream(join(localPath, basename(resolvedRemotePath)))
          let transferred = 0

          readStream.on('data', (chunk) => {
            transferred += chunk.length
            this.emit('progress', connectionId, {
              filename: basename(resolvedRemotePath),
              direction: 'download',
              total: stats.size,
              transferred,
              status: 'transferring'
            })
          })

          readStream.on('end', () => {
            this.emit('progress', connectionId, {
              filename: basename(resolvedRemotePath),
              direction: 'download',
              total: stats.size,
              transferred: stats.size,
              status: 'completed'
            })
            resolve()
          })

          readStream.on('error', (err) => {
            this.emit('progress', connectionId, {
              filename: basename(resolvedRemotePath),
              direction: 'download',
              total: stats.size,
              transferred,
              status: 'error',
              error: err.message
            })
            reject(err)
          })

          readStream.pipe(writeStream)
        })
      })
    })
  }

  async delete(connectionId: string, path: string): Promise<void> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')
    const resolvedPath = this.resolvePath(connectionId, path)

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)

        sftp.stat(resolvedPath, (err, stats) => {
          if (err) return reject(err)

          if ((stats.mode & 0o170000) === 0o040000) {
            sftp.rmdir(resolvedPath, (err) => {
              if (err) return reject(err)
              resolve()
            })
          } else {
            sftp.unlink(resolvedPath, (err) => {
              if (err) return reject(err)
              resolve()
            })
          }
        })
      })
    })
  }

  async mkdir(connectionId: string, path: string): Promise<void> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')
    const resolvedPath = this.resolvePath(connectionId, path)

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)
        sftp.mkdir(resolvedPath, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
  }

  async rename(connectionId: string, oldPath: string, newPath: string): Promise<void> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')
    const resolvedOld = this.resolvePath(connectionId, oldPath)
    const resolvedNew = this.resolvePath(connectionId, newPath)

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)
        sftp.rename(resolvedOld, resolvedNew, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
  }
}
