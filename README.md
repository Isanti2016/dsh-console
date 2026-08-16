# dsh-console

Console commands for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): manage the web service, the SSH tunnel, one-shot questions, and the optional [dsh-tui](https://github.com/dsh-console/dsh-tui) console — straight from the slash-command plane.

## Install

```sh
# from npm (when published)
dsh plugin --profile web add dsh-console

# or from this checkout
dsh plugin --profile web add ./dsh-console
```

Restart `dsh web`, then type `/help` or open the command palette.

## Commands

| Command | Description |
| --- | --- |
| `/web status` | Is the web UI up? (port + PID) |
| `/web start` | Background-start the web UI (`node bin.js web`) |
| `/web stop` | Stop the web UI process |
| `/web restart` | Restart it |
| `/tunnel status` | Is the SSH tunnel up? |
| `/tunnel start` | Start the SSH tunnel (needs `tunnelHost`) |
| `/tunnel stop` | Stop the tunnel |
| `/ask <问题>` | One-shot question through the headless profile (timeout-bounded) |
| `/console` | Launch the dsh-tui (needs `consoleCommand`) |

## Configuration

Set values in the profile's `cordis.patch.yml` (or `--patch` overlay), overriding the row added by this bundle:

```yaml
- id: dsh-console
  config:
    webPort: 3080
    dshBin: ''            # auto-detected from the running process when empty
    tunnelHost: '192.168.31.12'
    tunnelUser: 'root'
    tunnelKey: 'C:\\Users\\me\\.ssh\\id_rsa'
    tunnelLocalPort: 3081
    tunnelRemotePort: 3080
    askTimeout: 150
    consoleCommand: 'python G:\\tools\\dsh-tui\\main.py'
```

| Key | Default | Meaning |
| --- | --- | --- |
| `webPort` | `3080` | Port of the dsh web UI |
| `dshBin` | auto | Path to `apps/cli/lib/bin.js`; empty = detected from the running process |
| `tunnelHost` | `''` | SSH target host; empty disables `/tunnel start` |
| `tunnelUser` | `root` | SSH user |
| `tunnelKey` | `''` | SSH private key path (`-i`) |
| `tunnelLocalPort` | `3081` | Local tunnel listen port |
| `tunnelRemotePort` | `3080` | Remote port the tunnel forwards to |
| `askTimeout` | `150` | Seconds before `/ask` is killed |
| `consoleCommand` | `''` | Shell command launching the dsh-tui |

## Security notes

- `/web stop` and `/web restart` kill the process serving the current UI when run from the web profile — manage deliberately, or install this bundle into a CLI/headless profile instead.
- `/tunnel start` runs `ssh` with your configured key. Only configure `tunnelKey` from sources you trust.
- `/ask` runs the headless profile and consumes model quota; results are rendered by the command plane and never enter model history.

## Development

```sh
npm test          # node test of the backend primitives (read-only)
```

The bundle has no build step: plain ESM, ships `index.js` + `lib/` + `cordis.patch.yml`.
