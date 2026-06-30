export const IPC_CHANNELS = {
  SSH_CONNECT: 'ssh:connect',
  SSH_DISCONNECT: 'ssh:disconnect',
  SSH_EXEC: 'ssh:exec',
  SSH_DATA: 'ssh:data',
  SSH_RESIZE: 'ssh:resize',
  SSH_CONNECTED: 'ssh:connected',
  SSH_DISCONNECTED: 'ssh:disconnected',
  SSH_ERROR: 'ssh:error',

  SFTP_LIST: 'sftp:list',
  SFTP_UPLOAD: 'sftp:upload',
  SFTP_DOWNLOAD: 'sftp:download',
  SFTP_PROGRESS: 'sftp:progress',
  SFTP_DELETE: 'sftp:delete',
  SFTP_MKDIR: 'sftp:mkdir',
  SFTP_RENAME: 'sftp:rename',

  STORE_GET: 'store:get',
  STORE_SET: 'store:set',
  STORE_DELETE: 'store:delete',

  KEY_LIST: 'key:list',
  KEY_GENERATE: 'key:generate',
  KEY_IMPORT: 'key:import',
  KEY_DELETE: 'key:delete',
  KEY_GET_PUBLIC: 'key:getPublic',

  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_SAVE_FILE: 'dialog:saveFile',

  PORT_FORWARD_START: 'portForward:start',
  PORT_FORWARD_STOP: 'portForward:stop',
  PORT_FORWARD_STOP_ALL: 'portForward:stopAll',
  PORT_FORWARD_LIST: 'portForward:list',
} as const

export const DEFAULT_SSH_PORT = 22
export const DEFAULT_TERMINAL_COLS = 120
export const DEFAULT_TERMINAL_ROWS = 40
export const CONNECTION_TIMEOUT = 10000
export const KEEPALIVE_INTERVAL = 30000
