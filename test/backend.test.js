/**
 * dsh-console backend smoke test (plain Node, no dsh runtime needed).
 * Read-only checks only: never starts/stops the user's real services.
 */

import assert from 'node:assert'
import { createBackend } from '../lib/backend.js'

const backend = createBackend({
  webPort: 3080,
  dshBin: '',
  tunnelHost: '',
  tunnelUser: 'root',
  tunnelKey: '',
  tunnelLocalPort: 3081,
  tunnelRemotePort: 3080,
  askTimeout: 5,
  consoleCommand: '',
})

async function main() {
  // 1) web status — must not throw; reports running or not.
  const ws = await backend.web('status')
  console.log('web status ->', ws)
  assert.ok(ws.includes('网页界面') || ws.includes('端口'), 'web status should answer')

  // 2) tunnel status
  const ts = await backend.tunnel('status')
  console.log('tunnel status ->', ts)
  assert.ok(ts.includes('隧道'), 'tunnel status should answer')

  // 3) unknown subcommands
  const wu = await backend.web('frobnicate')
  console.log('web bad ->', wu)
  assert.ok(wu.includes('未知子命令'), 'web should reject unknown subcommand')

  // 4) ask with no question
  const aq = await backend.ask('')
  console.log('ask empty ->', aq)
  assert.ok(aq.includes('用法'), 'ask should demand a question')

  // 5) console without config
  const cc = await backend.console()
  console.log('console unconfigured ->', cc)
  assert.ok(cc.includes('consoleCommand'), 'console should demand config')

  // 6) web start without dshBin (use a free port so it reaches the bin check)
  const bare = createBackend({ webPort: 3999, dshBin: '', askTimeout: 5 })
  const ws2 = await bare.web('start')
  console.log('web start (no bin) ->', ws2)
  assert.ok(ws2.includes('dshBin'), 'web start should demand dshBin')

  console.log('ALL TESTS PASSED')
}

main().catch((e) => {
  console.error('TEST FAILURE:', e)
  process.exit(1)
})
