import React, { useState, useEffect } from 'react'
import { SSHKey } from '../../types'

export function SSHKeyManager() {
  const [keys, setKeys] = useState<SSHKey[]>([])
  const [showGenerate, setShowGenerate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyType, setNewKeyType] = useState<'rsa' | 'ed25519' | 'ecdsa'>('ed25519')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    const list = await window.api.keys.list()
    setKeys(list)
  }

  const handleGenerate = async () => {
    if (!newKeyName) return
    try {
      await window.api.keys.generate(newKeyName, newKeyType)
      setShowGenerate(false)
      setNewKeyName('')
      loadKeys()
    } catch (err: any) {
      alert(`生成失败: ${err.message}`)
    }
  }

  const handleImport = async () => {
    const result = await window.api.dialog.openFile({
      properties: ['openFile'],
      filters: [{ name: 'SSH Keys', extensions: ['pem', 'key', ''] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const name = result.filePaths[0].split('/').pop() || 'imported-key'
      try {
        await window.api.keys.import(name, result.filePaths[0])
        loadKeys()
      } catch (err: any) {
        alert(`导入失败: ${err.message}`)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此密钥?')) return
    try {
      await window.api.keys.delete(id)
      loadKeys()
    } catch (err: any) {
      alert(`删除失败: ${err.message}`)
    }
  }

  const handleCopyPublicKey = async (key: SSHKey) => {
    await navigator.clipboard.writeText(key.publicKey)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sidebar-text">SSH 密钥管理</h3>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="px-3 py-1.5 text-sm bg-sidebar-hover text-sidebar-text rounded-lg hover:bg-sidebar-active transition-colors"
          >
            导入密钥
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="px-3 py-1.5 text-sm bg-accent-blue text-[#11111b] rounded-lg font-medium hover:brightness-110 transition-all"
          >
            生成密钥
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {keys.length === 0 ? (
          <div className="text-center py-8 text-sidebar-muted">
            暂无 SSH 密钥
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="bg-sidebar-hover rounded-lg p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-text">{key.name}</div>
                <div className="text-xs text-sidebar-muted mt-1">
                  类型: {key.type.toUpperCase()} | 创建: {new Date(key.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <div className="text-xs text-sidebar-muted mt-1 truncate font-mono">
                  {key.publicKey.substring(0, 60)}...
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyPublicKey(key)}
                  className="px-3 py-1.5 text-xs bg-sidebar-active text-sidebar-text rounded hover:brightness-110 transition-all"
                >
                  {copiedId === key.id ? '已复制!' : '复制公钥'}
                </button>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="px-3 py-1.5 text-xs bg-accent-red/20 text-accent-red rounded hover:bg-accent-red/30 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-sidebar-bg border border-sidebar-hover rounded-xl w-[400px] p-6">
            <h3 className="text-lg font-semibold text-sidebar-text mb-4">生成新密钥</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-sidebar-muted mb-1">密钥名称</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="my-server-key"
                  className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-sm text-sidebar-muted mb-2">密钥类型</label>
                <div className="flex gap-2">
                  {(['ed25519', 'rsa', 'ecdsa'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewKeyType(type)}
                      className={`flex-1 py-2 rounded-lg text-sm ${
                        newKeyType === type
                          ? 'bg-accent-blue text-[#11111b] font-medium'
                          : 'bg-sidebar-hover text-sidebar-muted hover:text-sidebar-text'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowGenerate(false)}
                  className="px-4 py-2 text-sidebar-muted hover:text-sidebar-text"
                >
                  取消
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-accent-blue text-[#11111b] rounded-lg font-medium hover:brightness-110"
                >
                  生成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
