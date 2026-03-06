# AGENTS.md

- Use `bun` only. Do not use `npm`, `pnpm`, or `yarn`.
- Prefer `bun run <script>` for repo scripts.
- At the end of the work, run lint first: `bun run lint`.
- After lint passes, run formatting: `bun run format`.
- Do not run lint/format too often during implementation unless needed to check a specific change, since formatting is still relatively slow.
