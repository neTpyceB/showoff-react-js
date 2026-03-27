import { createServer } from 'node:net'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const findOpenPort = async () =>
  new Promise((resolve, reject) => {
    const server = createServer()

    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()

      if (!address || typeof address === 'string') {
        reject(new Error('Failed to resolve a free port for e2e.'))
        return
      }

      const { port } = address
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve(port)
      })
    })
  })

const waitForServer = async (baseUrl, timeoutMs = 60_000) => {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/healthz`)

      if (response.ok) {
        return
      }
    } catch {
      await delay(250)
      continue
    }

    await delay(250)
  }

  throw new Error(`Timed out waiting for ${baseUrl}.`)
}

const port = Number(process.env.E2E_PORT ?? (await findOpenPort()))
const baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const server = spawn(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'e2e:serve', '--', '--port', String(port)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  },
)

const stopServer = () => {
  if (!server.killed) {
    server.kill('SIGTERM')
  }
}

process.on('SIGINT', () => {
  stopServer()
  process.exit(130)
})

process.on('SIGTERM', () => {
  stopServer()
  process.exit(143)
})

try {
  await waitForServer(baseUrl)

  const runner = spawn(
    process.execPath,
    ['./e2e/run.mjs'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        E2E_PORT: String(port),
        E2E_BASE_URL: baseUrl,
      },
      stdio: 'inherit',
    },
  )

  const exitCode = await new Promise((resolve, reject) => {
    runner.on('error', reject)
    runner.on('exit', (code) => resolve(code ?? 1))
  })

  stopServer()
  process.exit(exitCode)
} catch (error) {
  stopServer()
  throw error
}
