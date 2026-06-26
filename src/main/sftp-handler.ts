import { Client } from 'ssh2'
import { EventEmitter } from 'events'
import { createReadStream, createWriteStream, statSync } from 'fs'
import { basename, join } from 'path'

export class SFTPHandler extends EventEmitter {
  private connections: Map<string, Client> = new Map()

  setConnection(id: string, client: Client): void {
    this.connections.set(id, client)
  }

  async list(connectionId: string, path: string): Promise<any[]> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)

        sftp.readdir(path, (err, list) => {
          if (err) return reject(err)

          const items = list.map(item => ({
            name: item.filename,
            path: join(path, item.filename),
            type: (item.attrs.mode & 0o170000) === 0o040000 ? 'directory' :
                  (item.attrs.mode & 0o170000) === 0o120000 ? 'symlink' : 'file',
            size: item.attrs.size,
            modifyTime: item.attrs.mtime * 1000,
            permissions: (item.attrs.mode & 0o777).toString(8),
            owner: item.attrs.uid.toString(),
            group: item.attrs.gid.toString()
          }))

          resolve(items)
        })
      })
    })
  }

  async upload(connectionId: string, localPath: string, remotePath: string): Promise<void> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)

        const remoteFilePath = join(remotePath, basename(localPath))
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

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)

        sftp.stat(remotePath, (err, stats) => {
          if (err) return reject(err)

          const readStream = sftp.createReadStream(remotePath)
          const writeStream = createWriteStream(join(localPath, basename(remotePath)))
          let transferred = 0

          readStream.on('data', (chunk) => {
            transferred += chunk.length
            this.emit('progress', connectionId, {
              filename: basename(remotePath),
              direction: 'download',
              total: stats.size,
              transferred,
              status: 'transferring'
            })
          })

          readStream.on('end', () => {
            this.emit('progress', connectionId, {
              filename: basename(remotePath),
              direction: 'download',
              total: stats.size,
              transferred: stats.size,
              status: 'completed'
            })
            resolve()
          })

          readStream.on('error', (err) => {
            this.emit('progress', connectionId, {
              filename: basename(remotePath),
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

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)

        sftp.stat(path, (err, stats) => {
          if (err) return reject(err)

          if ((stats.mode & 0o170000) === 0o040000) {
            sftp.rmdir(path, (err) => {
              if (err) return reject(err)
              resolve()
            })
          } else {
            sftp.unlink(path, (err) => {
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

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)
        sftp.mkdir(path, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
  }

  async rename(connectionId: string, oldPath: string, newPath: string): Promise<void> {
    const client = this.connections.get(connectionId)
    if (!client) throw new Error('Not connected')

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) return reject(err)
        sftp.rename(oldPath, newPath, (err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
  }
}
