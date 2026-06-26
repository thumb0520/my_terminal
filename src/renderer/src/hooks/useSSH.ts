import { useCallback, useEffect } from 'react'
import { useConnectionStore } from '../store/connectionStore'
import { useTerminalStore } from '../store/terminalStore'
import { SSHConnection, ConnectionStatus } from '../types'

export function useSSH() {
  const {
    connections,
    activeConnectionId,
    connectionStatuses,
    setConnectionStatus,
    addConnection,
    updateConnection,
    removeConnection
  } = useConnectionStore()

  const { addTab, removeTab, getTabByConnection } = useTerminalStore()

  useEffect(() => {
    const unsubConnected = window.api.ssh.onConnected((id) => {
      setConnectionStatus(id, 'connected')
    })

    const unsubDisconnected = window.api.ssh.onDisconnected((id) => {
      setConnectionStatus(id, 'disconnected')
    })

    const unsubError = window.api.ssh.onError((id, error) => {
      setConnectionStatus(id, 'error')
      console.error(`SSH error [${id}]:`, error)
    })

    return () => {
      unsubConnected()
      unsubDisconnected()
      unsubError()
    }
  }, [])

  const connect = useCallback(async (config: SSHConnection) => {
    const id = config.id || crypto.randomUUID()
    const connection = { ...config, id }

    addConnection(connection)
    setConnectionStatus(id, 'connecting')

    const tabId = crypto.randomUUID()
    addTab({
      id: tabId,
      connectionId: id,
      title: config.name,
      status: 'connecting'
    })

    try {
      await window.api.ssh.connect({
        id,
        host: config.host,
        port: config.port,
        username: config.username,
        authType: config.authType,
        password: config.password,
        privateKeyPath: config.privateKeyPath,
        passphrase: config.passphrase
      })

      setConnectionStatus(id, 'connected')
      return id
    } catch (err: any) {
      setConnectionStatus(id, 'error')
      throw err
    }
  }, [])

  const disconnect = useCallback(async (id: string) => {
    try {
      await window.api.ssh.disconnect(id)
      setConnectionStatus(id, 'disconnected')

      const tab = getTabByConnection(id)
      if (tab) removeTab(tab.id)
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  }, [])

  const writeToTerminal = useCallback((connectionId: string, data: string) => {
    window.api.ssh.write(connectionId, data)
  }, [])

  const resizeTerminal = useCallback((connectionId: string, cols: number, rows: number) => {
    window.api.ssh.resize(connectionId, cols, rows)
  }, [])

  const saveConnection = useCallback(async (connection: SSHConnection) => {
    const existing = connections.find(c => c.id === connection.id)
    if (existing) {
      updateConnection(connection.id, connection)
    } else {
      addConnection(connection)
    }
    await window.api.store.set('connections', connections)
  }, [connections])

  const deleteConnection = useCallback(async (id: string) => {
    removeConnection(id)
    await window.api.store.set('connections', connections.filter(c => c.id !== id))
  }, [connections])

  return {
    connections,
    activeConnectionId,
    connectionStatuses,
    connect,
    disconnect,
    writeToTerminal,
    resizeTerminal,
    saveConnection,
    deleteConnection
  }
}
