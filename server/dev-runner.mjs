import { spawn } from 'node:child_process'

const backend = spawn(
  'npx',
  ['tsx', 'server/index.ts', '--mode', 'api', '--host', '127.0.0.1', '--port', '3001'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

const frontend = spawn(
  'npx',
  ['vite', '--host', '0.0.0.0', '--port', '5173'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

const shutdown = () => {
  backend.kill('SIGTERM')
  frontend.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

backend.on('exit', (code) => {
  if (code && code !== 0) {
    process.exit(code)
  }
})

frontend.on('exit', (code) => {
  if (code && code !== 0) {
    process.exit(code)
  }
})
