/**
 * dsh-console backend — portable host management primitives.
 *
 * Pure Node (no dsh runtime needed): used by the plugin's command handlers and
 * exercised directly by the test suite. Every function returns a human-readable
 * result string.
 */

import { spawn, execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'
import { promisify } from 'node:util'

const execFileP = promisify(execFile)
const isWindows = () => process.platform === 'win32'

/** True when something is listening on 127.0.0.1:port. */
export function portListening(port, host = '127.0.0.1', timeout = 800) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host })
    sock.setTimeout(timeout)
    sock.once('connect', () => { sock.destroy(); resolve(true) })
    sock.once('error', () => resolve(false))
    sock.once('timeout', () => { sock.destroy(); resolve(false) })
  })
}

/** True when an HTTP GET on 127.0.0.1:port answers ok. */
async function httpOk(port, timeout = 1000) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(timeout) })
    return res.ok
  } catch {
    return false
  }
}

/** PID of the process listening on port, or null. */
export async function listenerPid(port) {
  try {
    if (isWindows()) {
      const { stdout } = await execFileP('netstat', ['-ano'], { timeout: 8000 })
      const re = new RegExp(`TCP\\s+(?:127\\.0\\.0\\.1|0\\.0\\.0\\.0|\\[::\\]):${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)`)
      for (const line of stdout.split(/\r?\n/)) {
        const m = line.trim().match(re)
        if (m) return Number(m[1])
      }
      return null
    }
    const { stdout } = await execFileP('lsof', ['-nP', '-iTCP', `:${port}`, '-sTCP:LISTEN'], { timeout: 5000 }).catch(() => ({ stdout: '' }))
    const pid = stdout.split(/\r?\n/).slice(1).map((l) => l.trim().split(/\s+/)[1]).find((v) => /^\d+$/.test(v ?? ''))
    return pid ? Number(pid) : null
  } catch {
    return null
  }
}

async function killPid(pid) {
  try {
    if (isWindows()) await execFileP('taskkill', ['/PID', String(pid), '/F'], { timeout: 8000 })
    else await execFileP('kill', ['-9', String(pid)], { timeout: 8000 })
    return true
  } catch {
    return false
  }
}

/** Detached spawn that survives the parent; windowsHide keeps the console clean. */
function spawnDetached(command, args) {
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true })
  child.unref()
  return child
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Create a backend bound to the given config. */
export function createBackend(config) {
  const {
    webPort = 3080,
    dshBin = '',
    tunnelHost = '',
    tunnelUser = 'root',
    tunnelKey = '',
    tunnelLocalPort = 3081,
    tunnelRemotePort = 3080,
    askTimeout = 150,
    consoleCommand = '',
  } = config

  const webUrl = () => `http://127.0.0.1:${webPort}`

  // ---------------- web service ----------------

  async function web(action) {
    switch (action) {
      case 'status': {
        if (await httpOk(webPort)) {
          const pid = await listenerPid(webPort)
          return `网页界面运行中 (PID ${pid ?? '?'}) ${webUrl()}`
        }
        if (await portListening(webPort)) return `端口 ${webPort} 被占用但 HTTP 无响应`
        return `网页界面未运行 (${webUrl()})`
      }
      case 'start': {
        if (await httpOk(webPort)) return `已在运行 ${webUrl()}`
        if (!dshBin) return '错误：未配置 dshBin（或无法自动探测 dsh 入口）'
        if (!existsSync(dshBin)) return `错误：找不到 dshBin: ${dshBin}`
        spawnDetached(process.execPath, [dshBin, 'web', '--port', String(webPort)])
        for (let i = 0; i < 40; i++) {
          await sleep(500)
          if (await httpOk(webPort)) {
            const pid = await listenerPid(webPort)
            return `启动成功 ${webUrl()} (PID ${pid ?? '?'})`
          }
        }
        return '启动超时（20 秒）…… 请检查 dshBin 与日志'
      }
      case 'stop': {
        const pid = await listenerPid(webPort)
        if (pid === null) return '网页界面未运行'
        await killPid(pid)
        await sleep(500)
        return `已停止网页服务 (PID ${pid})`
      }
      case 'restart': {
        const pid = await listenerPid(webPort)
        if (pid !== null) await killPid(pid)
        await sleep(500)
        return web('start')
      }
      default:
        return `未知子命令: ${action}（支持 status|start|stop|restart）`
    }
  }

  // ---------------- SSH tunnel ----------------

  function tunnelArgs() {
    return [
      ...(tunnelKey ? ['-i', tunnelKey] : []),
      '-N',
      '-L', `${tunnelLocalPort}:127.0.0.1:${tunnelRemotePort}`,
      '-o', 'ExitOnForwardFailure=yes',
      '-o', 'ServerAliveInterval=30',
      '-o', 'ServerAliveCountMax=3',
      '-o', 'BatchMode=yes',
      '-o', 'StrictHostKeyChecking=accept-new',
      `${tunnelUser}@${tunnelHost}`,
    ]
  }

  async function tunnel(action) {
    switch (action) {
      case 'status': {
        if (await portListening(tunnelLocalPort)) {
          const pid = await listenerPid(tunnelLocalPort)
          return `隧道运行中 (PID ${pid ?? '?'}) http://127.0.0.1:${tunnelLocalPort}`
        }
        return `隧道未运行 (http://127.0.0.1:${tunnelLocalPort})`
      }
      case 'start': {
        if (await portListening(tunnelLocalPort)) return `隧道已在运行 http://127.0.0.1:${tunnelLocalPort}`
        if (!tunnelHost) return '错误：未配置 tunnelHost（例如 tunnelHost: 192.168.31.12）'
        spawnDetached('ssh', tunnelArgs())
        for (let i = 0; i < 40; i++) {
          await sleep(500)
          if (await portListening(tunnelLocalPort)) {
            const pid = await listenerPid(tunnelLocalPort)
            return `隧道启动成功 (PID ${pid ?? '?'}) http://127.0.0.1:${tunnelLocalPort}`
          }
        }
        return '隧道启动超时（20 秒）…… 请检查 tunnelHost / tunnelKey 与 ssh 可用性'
      }
      case 'stop': {
        const pid = await listenerPid(tunnelLocalPort)
        if (pid === null) return '隧道未运行'
        await killPid(pid)
        await sleep(500)
        return `隧道已停止 (PID ${pid})`
      }
      default:
        return `未知子命令: ${action}（支持 status|start|stop）`
    }
  }

  // ---------------- one-shot ask ----------------

  async function ask(question) {
    if (!question) return '用法: /ask <你的问题>'
    if (!dshBin) return '错误：未配置 dshBin'
    if (!existsSync(dshBin)) return `错误：找不到 dshBin: ${dshBin}`
    return new Promise((resolve) => {
      const child = spawn(process.execPath, [dshBin, '--profile', 'headless', question], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      let out = ''
      let err = ''
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        resolve(`超时（${askTimeout} 秒）…… 任务已终止`)
      }, askTimeout * 1000)
      child.stdout.on('data', (d) => { out += d })
      child.stderr.on('data', (d) => { err += d })
      child.on('error', (e) => { clearTimeout(timer); resolve(`错误：${e.message}`) })
      child.on('close', (code) => {
        clearTimeout(timer)
        const text = out.trim()
        if (code !== 0 && !text) {
          resolve(`AI 调用失败 (code ${code})\n${err.trim().split(/\r?\n/).slice(-8).map((l) => `  ${l}`).join('\n')}`)
          return
        }
        resolve(text || `AI 无输出 (code ${code})`)
      })
    })
  }

  // ---------------- console TUI launcher ----------------

  async function console() {
    if (!consoleCommand) {
      return '错误：未配置 consoleCommand（例如指向 dsh-tui 的 main.py 或可执行入口）'
    }
    spawnDetached(isWindows() ? 'cmd' : 'sh', isWindows() ? ['/c', 'start', '', consoleCommand] : ['-c', consoleCommand])
    return 'dsh 操作台已在后台启动（若未出现请检查 consoleCommand 配置）'
  }

  return { web, tunnel, ask, console, internals: { portListening, listenerPid } }
}
