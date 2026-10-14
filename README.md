# MagicBag sales stats agent

Counts leads per shift from the Sitniks CRM, matches orders posted in Telegram, and reports to a Telegram group and a Google Sheet.

## Stack
Node.js, NestJS (standalone app, no HTTP server), TypeScript, dotenv. No database.

## Layout
- `ai/` - rules for the AI assistant (`ai_rule.md`)
- `src/config/` - environment loading
- `src/sitniks/` - Sitniks CRM service
- `src/schedule/` - shift schedule from the Google Sheet
- `src/leads/` - lead counting rules (statuses, sources)
- `src/common/` - shared helpers (Kyiv time, waiting)
- `src/cli/` - command line entry points
- `src/types/` - shared types
- `tests/` - tests

Imports use the `@/` alias for `src/`. Relative imports are blocked by the linter.

## Setup
Copy `.env.example` to `.env` and fill in the values. Never commit `.env` or `credentials/`.

## Scripts
- `npm run build` - compile to `dist/`
- `npm run leads -- --date 2026-10-14 --managers "Name One,Name Two"` (or `--shift 1`, managers taken from the schedule) - print lead counts for a day (reads `.env`)
- `npm test` - run unit tests
- `npm run lint` - check code against `code-style-rules.md` (see `eslint.config.mjs`)
- `npm run lint:fix` - auto-fix what the linter can
