# MagicBag sales stats agent

Collects sales stats from the Sitniks CRM twice a day and writes them to a Google Sheet.

## Stack
Node.js, NestJS (standalone app, no HTTP server), TypeScript, dotenv. No database.

## Layout
- `ai/` - rules for the AI assistant (`ai_rule.md`)
- `src/config/` - environment loading
- `src/sitniks/` - Sitniks CRM service
- `src/sheets/` - Google Sheets service
- `src/agent/` - agent that ties the steps together
- `src/types/` - shared types
- `tests/` - tests

Imports use the `@/` alias for `src/`. Relative imports are blocked by the linter.

## Setup
Copy `.env.example` to `.env` and fill in the values. Never commit `.env` or `credentials/`.

## Scripts
- `npm run build` - compile to `dist/`
- `npm start` - run one stats collection (reads `.env`)
- `npm run lint` - check code against `code-style-rules.md` (see `eslint.config.mjs`)
- `npm run lint:fix` - auto-fix what the linter can
