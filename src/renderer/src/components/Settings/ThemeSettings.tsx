import React from 'react'
import { useSettingsStore } from '../../store/settingsStore'

export function ThemeSettings() {
  const { settings, setSettings, saveSettings } = useSettingsStore()

  const themes = [
    { id: 'dark', name: '深色', icon: '🌙' },
    { id: 'light', name: '浅色', icon: '☀️' }
  ]

  const terminalThemes = [
    { id: 'catppuccin-mocha', name: 'Catppuccin Mocha' },
    { id: 'dracula', name: 'Dracula' },
    { id: 'monokai', name: 'Monokai' },
    { id: 'solarized-dark', name: 'Solarized Dark' },
    { id: 'solarized-light', name: 'Solarized Light' },
    { id: 'nord', name: 'Nord' }
  ]

  const cursorStyles = [
    { id: 'block', name: '方块' },
    { id: 'underline', name: '下划线' },
    { id: 'bar', name: '竖线' }
  ]

  const handleChange = async (updates: Partial<typeof settings>) => {
    setSettings(updates)
    await saveSettings()
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-sidebar-text">主题设置</h3>

      <div>
        <label className="block text-sm text-sidebar-muted mb-2">应用主题</label>
        <div className="flex gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleChange({ theme: theme.id as 'dark' | 'light' })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
                settings.theme === theme.id
                  ? 'bg-accent-blue text-[#11111b] font-medium'
                  : 'bg-sidebar-hover text-sidebar-text hover:bg-sidebar-active'
              }`}
            >
              <span>{theme.icon}</span>
              <span>{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-sidebar-muted mb-2">终端配色</label>
        <div className="grid grid-cols-2 gap-2">
          {terminalThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleChange({ terminalTheme: theme.id })}
              className={`py-2 px-4 rounded-lg text-sm text-left transition-colors ${
                settings.terminalTheme === theme.id
                  ? 'bg-accent-blue text-[#11111b] font-medium'
                  : 'bg-sidebar-hover text-sidebar-text hover:bg-sidebar-active'
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-sidebar-muted mb-2">
          字体大小: {settings.fontSize}px
        </label>
        <input
          type="range"
          min="10"
          max="24"
          value={settings.fontSize}
          onChange={(e) => handleChange({ fontSize: parseInt(e.target.value) })}
          className="w-full accent-accent-blue"
        />
      </div>

      <div>
        <label className="block text-sm text-sidebar-muted mb-2">光标样式</label>
        <div className="flex gap-3">
          {cursorStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => handleChange({ cursorStyle: style.id as any })}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                settings.cursorStyle === style.id
                  ? 'bg-accent-blue text-[#11111b] font-medium'
                  : 'bg-sidebar-hover text-sidebar-text hover:bg-sidebar-active'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-sidebar-muted">光标闪烁</span>
        <button
          onClick={() => handleChange({ cursorBlink: !settings.cursorBlink })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.cursorBlink ? 'bg-accent-blue' : 'bg-sidebar-hover'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full transition-transform ${
              settings.cursorBlink ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div>
        <label className="block text-sm text-sidebar-muted mb-2">
          回滚行数: {settings.scrollback}
        </label>
        <input
          type="range"
          min="1000"
          max="50000"
          step="1000"
          value={settings.scrollback}
          onChange={(e) => handleChange({ scrollback: parseInt(e.target.value) })}
          className="w-full accent-accent-blue"
        />
      </div>
    </div>
  )
}
