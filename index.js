/**
 * dsh-console — console commands for the DeepSeek Harness host.
 *
 * Registers slash commands into the dsh command registry:
 *   /web status|start|stop|restart   manage the dsh web service
 *   /tunnel status|start|stop        manage the SSH tunnel
 *   /ask <question>                  one-shot question via the headless profile
 *   /console                         launch the dsh-tui (Python console)
 *
 * All heavy lifting lives in ./lib/backend.js (pure Node, testable).
 */

import Schema from '@deepseek-ai/schemastery'
import { createBackend } from './lib/backend.js'

export const name = 'dsh-console'

export const inject = ['commands']

/** Deployment configuration; defaults live on the schema. */
export const Config = Schema.object({
  webPort: Schema.number().default(3080),
  // Path to apps/cli/lib/bin.js; empty = auto-detect from the running process.
  dshBin: Schema.string().default(''),
  // SSH tunnel target; empty disables tunnel start.
  tunnelHost: Schema.string().default(''),
  tunnelUser: Schema.string().default('root'),
  tunnelKey: Schema.string().default(''),
  tunnelLocalPort: Schema.number().default(3081),
  tunnelRemotePort: Schema.number().default(3080),
  askTimeout: Schema.number().default(150),
  // Command line used by /console to launch the dsh-tui.
  consoleCommand: Schema.string().default(''),
})

/** Heuristic dsh entry: the running host process's own bin.js. */
function autoDshBin() {
  const entry = process.argv[1]
  if (typeof entry === 'string' && /(^|[\\/])bin\.js$/i.test(entry)) return entry
  return ''
}

export function apply(ctx, config) {
  const backend = createBackend({
    webPort: config.webPort,
    dshBin: config.dshBin || autoDshBin(),
    tunnelHost: config.tunnelHost,
    tunnelUser: config.tunnelUser,
    tunnelKey: config.tunnelKey,
    tunnelLocalPort: config.tunnelLocalPort,
    tunnelRemotePort: config.tunnelRemotePort,
    askTimeout: config.askTimeout,
    consoleCommand: config.consoleCommand,
  })

  const def = (name, description, run) => {
    ctx.commands.register({
      name,
      description,
      handler: async ({ rawInput }) => {
        try {
          return { kind: 'success', text: await run(rawInput.trim()) }
        } catch (error) {
          return {
            kind: 'error',
            text: `dsh-console: ${error instanceof Error ? error.message : String(error)}`,
          }
        }
      },
    })
  }

  def('web', 'Manage the dsh web service: /web status|start|stop|restart', (arg) => backend.web(arg || 'status'))
  def('tunnel', 'Manage the SSH tunnel: /tunnel status|start|stop', (arg) => backend.tunnel(arg || 'status'))
  def('ask', 'One-shot question via the headless profile: /ask 你的问题', (arg) => backend.ask(arg))
  def('console', 'Launch the dsh-tui console (needs consoleCommand config)', () => backend.console())
}
