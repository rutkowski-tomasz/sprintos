# CLAUDE.md

## Rules

- Docs: Record only non-default, non-obvious, non-standard behaviors. Omit anything a competent developer would assume. Keep entries short and direct.
- Code comments: None. Names and structure carry meaning.
- README: Scannable, targeting humans.
- Package manager: Always use `pnpm`.
- Docs sync: If any implementation decision differs from `docs/product.md`, update that file before finishing the task.

## Project Docs

| File | Contents |
|------|----------|
| `docs/product.md` | Vision, stack decisions, sprint cycle, entities, views, and all UX rules (input parsing, gestures, animations, native-feel requirements) |
| `docs/data_model.md` | Schema definitions, field types, indexes, sync/conflict strategy, and business logic rules |
| `docs/roadmap.md` | Phased implementation plan — 26 tasks across 5 phases from POC to AI completions |
