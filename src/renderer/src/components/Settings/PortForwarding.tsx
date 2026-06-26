import React, { useState } from 'react'
import { PortForward } from '../../types'

export function PortForwarding() {
  const [forwards, setForwards] = useState<PortForward[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'local' as 'local' | 'remote' | 'dynamic',
    localHost: '127.0.0.1',
    localPort: 8080,
    remoteHost: '127.0.0.1',
    remotePort: 80
  })

  const handleAdd = () => {
    const forward: PortForward = {
      id: crypto.randomUUID(),
      ...form,
      connectionId: ''
    }
    setForwards([...forwards, forward])
    setShowAdd(false)
    setForm({
      name: '',
      type: 'local',
      localHost: '127.0.0.1',
      localPort: 8080,
      remoteHost: '127.0.0.1',
      remotePort: 80
    })
  }

  const handleDelete = (id: string) => {
    setForwards(forwards.filter(f => f.id !== id))
  }

  const typeLabels = {
    local: '本地转发',
    remote: '远程转发',
    dynamic: '动态转发 (SOCKS5)'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-sidebar-text">端口转发</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-1.5 text-sm bg-accent-blue text-[#11111b] rounded-lg font-medium hover:brightness-110 transition-all"
        >
          添加转发
        </button>
      </div>

      {forwards.length === 0 ? (
        <div className="text-center py-8 text-sidebar-muted">
          暂无端口转发规则
        </div>
      ) : (
        <div className="space-y-2">
          {forwards.map((forward) => (
            <div
              key={forward.id}
              className="bg-sidebar-hover rounded-lg p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-text">
                  {forward.name || '未命名转发'}
                </div>
                <div className="text-xs text-sidebar-muted mt-1">
                  <span className="bg-sidebar-active px-2 py-0.5 rounded mr-2">
                    {typeLabels[forward.type]}
                  </span>
                  {forward.localHost}:{forward.localPort}
                  {forward.type !== 'dynamic' && (
                    <> → {forward.remoteHost}:{forward.remotePort}</>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(forward.id)}
                className="px-3 py-1.5 text-xs bg-accent-red/20 text-accent-red rounded hover:bg-accent-red/30 transition-colors"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-sidebar-bg border border-sidebar-hover rounded-xl w-[480px] p-6">
            <h3 className="text-lg font-semibold text-sidebar-text mb-4">添加端口转发</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-sidebar-muted mb-1">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My Forward"
                  className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                />
              </div>
              <div>
                <label className="block text-sm text-sidebar-muted mb-2">类型</label>
                <div className="flex gap-2">
                  {(['local', 'remote', 'dynamic'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, type })}
                      className={`flex-1 py-2 rounded-lg text-sm ${
                        form.type === type
                          ? 'bg-accent-blue text-[#11111b] font-medium'
                          : 'bg-sidebar-hover text-sidebar-muted hover:text-sidebar-text'
                      }`}
                    >
                      {typeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-sidebar-muted mb-1">本地地址</label>
                  <input
                    type="text"
                    value={form.localHost}
                    onChange={(e) => setForm({ ...form, localHost: e.target.value })}
                    className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sidebar-muted mb-1">本地端口</label>
                  <input
                    type="number"
                    value={form.localPort}
                    onChange={(e) => setForm({ ...form, localPort: parseInt(e.target.value) || 0 })}
                    className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                  />
                </div>
              </div>
              {form.type !== 'dynamic' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-sidebar-muted mb-1">远程地址</label>
                    <input
                      type="text"
                      value={form.remoteHost}
                      onChange={(e) => setForm({ ...form, remoteHost: e.target.value })}
                      className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-sidebar-muted mb-1">远程端口</label>
                    <input
                      type="number"
                      value={form.remotePort}
                      onChange={(e) => setForm({ ...form, remotePort: parseInt(e.target.value) || 0 })}
                      className="w-full bg-sidebar-hover text-sidebar-text rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sidebar-muted hover:text-sidebar-text"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-accent-blue text-[#11111b] rounded-lg font-medium hover:brightness-110"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
