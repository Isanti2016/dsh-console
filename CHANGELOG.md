# Changelog

All notable changes to dsh-console are documented here.

## [0.1.0] - 2026-08-16

### Added

- Initial release: slash-command console for DeepSeek Harness.
  - `/web status|start|stop|restart` — manage the dsh web UI service (auto-detects the running dsh entry; zero config for the basics).
  - `/tunnel status|start|stop` — SSH tunnel management (configurable host/user/key in the profile's `cordis.patch.yml`).
  - `/ask` — one-shot question.
  - `/console` — optional console TUI launcher (configurable command path).
- Backend (`lib/backend.js`) with read-only smoke tests (`test/backend.test.js`).
