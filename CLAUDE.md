# CLAUDE.md

## Rules

**Docs**: Record only non-default, non-obvious, non-standard behaviors. Omit anything a competent developer would assume. Keep entries short and direct — verbose input from the user does not mean verbose output in docs or code.

**Code comments**: None. Names and structure carry meaning; comments do not belong in the output.

**README**: Scannable, targeting humans.

## Project Docs

| File | Contents |
|------|----------|
| `product.md` | Vision, stack decisions, sprint cycle, entities, views, and all UX rules (input parsing, gestures, animations, native-feel requirements) |
| `data_model.md` | Schema definitions, field types, indexes, sync/conflict strategy, and business logic rules |
| `roadmap.md` | Phased implementation plan — 26 tasks across 5 phases from POC to AI completions |
