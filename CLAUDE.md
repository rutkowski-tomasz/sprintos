# CLAUDE.md

- Only document non-obvious, non-standard behaviors. Keep entries short and direct.
- Never write code comments. Names and structure carry meaning.
- READMEs are scannable and target humans.
- Always use `bun`.
- `docs/product.md` is the single source of truth for product decisions (vision, stack, sync rules, sprint cycle, entities, views, UX rules). Update it before finishing any task where the implementation differs from what it describes.
- Assume dev server is running at `localhost:5173`. If not ask user to start it with `bun dev`.
- Verify changes using Chrome MCP; Use email `test@example.com`, password `test1234`.