# SSH Manager

一个好用的 SSH 连接管理工具，专为 macOS 设计。

## 功能特性

- 🖥️ **多连接管理** - 同时管理多个 SSH 连接，支持分组
- 📁 **文件传输** - 通过 SFTP 上传下载文件，支持拖拽
- 🔑 **密钥管理** - 生成、导入、管理 SSH 密钥
- 🎨 **主题定制** - 深色/浅色主题，多种终端配色方案
- 🔧 **端口转发** - 支持本地、远程、动态端口转发
- 💾 **配置持久化** - 连接配置自动保存

## 技术栈

- Electron 28
- React 18
- TypeScript
- xterm.js
- ssh2
- Tailwind CSS
- Zustand

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run dist
```

生成 macOS `.dmg` 安装包。

## 项目结构

```
src/
├── main/              # Electron 主进程
│   ├── index.ts       # 入口文件
│   ├── ssh-manager.ts # SSH 连接管理
│   ├── sftp-handler.ts# SFTP 文件传输
│   ├── store.ts       # 配置持久化
│   └── key-manager.ts # SSH 密钥管理
├── preload/           # 预加载脚本
├── renderer/          # React 前端
│   └── src/
│       ├── components/
│       │   ├── Sidebar/     # 左侧连接列表
│       │   ├── Terminal/    # 终端面板
│       │   ├── FileManager/ # 文件管理
│       │   └── Settings/    # 设置页面
│       ├── store/           # Zustand 状态管理
│       └── hooks/           # React Hooks
└── shared/            # 共享常量和类型
```

## 使用说明

1. 点击左下角「新建连接」添加 SSH 服务器
2. 填写主机地址、用户名、密码或密钥
3. 点击连接即可打开终端
4. 使用顶部工具栏切换终端/文件管理/设置
5. 文件管理支持拖拽上传和右键下载

## License

MIT
