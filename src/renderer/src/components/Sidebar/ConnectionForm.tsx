import React, { useState, useEffect } from 'react'
import { SSHConnection } from '../../types'

interface ConnectionFormProps {
  connection?: SSHConnection | null
  onSave: (connection: SSHConnection) => void
  onCancel: () => void
}

export function ConnectionForm({ connection, onSave, onCancel }: ConnectionFormProps) {
  const [form, setForm] = useState<SSHConnection>({
    id: '',
    name: '',
    host: '',
    port: 22,
    username: '',
    authType: 'password',
    password: '',
    privateKeyPath: '',
    passphrase: '',
    group: 'default',
    color: '#89b4fa'
  })

  useEffect(() => {
    if (connection) {
      setForm(connection)
    }
  }, [connection])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...form,
      id: form.id || crypto.randomUUID()
    })
  }

  const handleSelectKey = async () => {
    const result = await window.api.dialog.openFile({
      properties: ['openFile'],
      filters: [{ name: 'SSH Keys', extensions: ['pem', 'key', 'pub', ''] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      setForm({ ...form, privateKeyPath: result.filePaths[0] })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-sidebar-bg border border-sidebar-hover rounded-xl w-[480px] shadow-2xl">
        <div className="px-6 py-4 border-b border-sidebar-hover">
          <h2 className="text-lg font-semibold text-sidebar-text">
            {connection ? '编辑连接' : '新建连接'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-sidebar-muted mb-1">连接名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Server"
              className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-sidebar-muted mb-1">主机地址</label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="192.168.1.100"
                className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-sidebar-muted mb-1">端口</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 22 })}
                className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-sidebar-muted mb-1">用户名</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="root"
              className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-sidebar-muted mb-2">认证方式</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, authType: 'password' })}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  form.authType === 'password'
                    ? 'bg-accent-blue text-[#11111b] font-medium'
                    : 'bg-sidebar-hover text-sidebar-muted hover:text-sidebar-text'
                }`}
              >
                密码
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, authType: 'key' })}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  form.authType === 'key'
                    ? 'bg-accent-blue text-[#11111b] font-medium'
                    : 'bg-sidebar-hover text-sidebar-muted hover:text-sidebar-text'
                }`}
              >
                密钥
              </button>
            </div>
          </div>

          {form.authType === 'password' ? (
            <div>
              <label className="block text-sm text-sidebar-muted mb-1">密码</label>
              <input
                type="password"
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-sidebar-muted mb-1">私钥路径</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.privateKeyPath || ''}
                    onChange={(e) => setForm({ ...form, privateKeyPath: e.target.value })}
                    placeholder="~/.ssh/id_rsa"
                    className="flex-1 bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  />
                  <button
                    type="button"
                    onClick={handleSelectKey}
                    className="px-4 py-2 bg-sidebar-hover text-sidebar-text rounded-lg hover:bg-sidebar-active transition-colors"
                  >
                    浏览
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-sidebar-muted mb-1">密钥密码 (可选)</label>
                <input
                  type="password"
                  value={form.passphrase || ''}
                  onChange={(e) => setForm({ ...form, passphrase: e.target.value })}
                  placeholder="留空无密码"
                  className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-sidebar-muted mb-1">分组</label>
            <select
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
            >
              <option value="default">默认分组</option>
              <option value="production">生产环境</option>
              <option value="staging">测试环境</option>
              <option value="development">开发环境</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-sidebar-muted mb-1">颜色标记</label>
            <div className="flex gap-2">
              {['#89b4fa', '#a6e3a1', '#f38ba8', '#f9e2af', '#cba6f7', '#94e2d5'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    form.color === color ? 'scale-125 ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-sidebar-muted hover:text-sidebar-text transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-accent-blue text-[#11111b] rounded-lg font-medium hover:brightness-110 transition-all"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
