# AI rules

## Project
- MagicBag sales statistics agent: twice a day it collects sales stats from the Sitniks CRM and writes them to a Google Sheet.
- Store sells women's bags and backpacks via Instagram and Facebook.
- Stack: Node.js, NestJS (standalone app), TypeScript, dotenv. No database. Keep it simple.

## Rules
- Code style and decision rules: see `../code-style-rules.md`. Follow them for all new code.
- The rules are enforced by `eslint.config.mjs`. After every change run `npm run lint` and `npm run build`; fix every error before reporting the task as done.
- Imports use the `@/` alias (maps to `src/`). Relative imports are forbidden.
- All code, comments, commit messages and docs are in English. Talk to the owner in Russian.
- Never commit secrets. Keys live in `.env` only (template: `.env.example`).
- Commit only when the owner asks.
- Do not invent Sitniks API endpoints or fields: use the official docs or ask the owner.
