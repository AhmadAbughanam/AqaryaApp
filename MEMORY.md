# Aqarya Working Memory

## Purpose
This file is the continuously updated working memory for Claude in this repository.

Use it to store durable project knowledge that becomes important over time:
- active decisions
- current constraints
- recurring gotchas
- recent architecture choices
- known follow-ups
- temporary but important context for ongoing work

Do not use this file for secrets, tokens, passwords, or `.env` values.

## How Claude Should Use This File
- Read this file at the start of tasks when project history or recent decisions may matter.
- Update it after meaningful work that changes how future tasks should be approached.
- Prefer short, high-signal entries.
- Remove stale items instead of letting the file grow without control.
- Keep facts concrete and repo-specific.
- Do not duplicate large amounts of content already documented in `CLAUDE.md` or `CONTEXT.md`.

## Update Rules
- Add new items when a decision will affect future work.
- Update items when the decision changes.
- Remove items when they are obsolete.
- Prefer bullets over long paragraphs.
- Include dates for recent changes when useful.
- Treat this file as shared team memory, not scratch notes.

## Stable Project Memory
- Mobile app: React Native app in repo root.
- Backend: NestJS + Prisma app in `backend/`.
- Auth depends on both secure token storage and persisted role state.
- Frontend default dev API base URL is `http://10.0.2.2:3000`.
- Sale and investment property flows must remain distinct.
- Do not edit generated files in `backend/dist/`; edit source under `backend/src/`.

## Current Architecture Notes
- Root app bootstrap and auth restore live in `App.tsx`.
- Role-based navigation is split between citizen and admin stacks.
- User-facing strings are centralized in `src/constants/strings.ts`.
- Verification, audit, analytics, and lifecycle behavior span both mobile and backend layers.

## Active Decisions
- `2026-04-02`: Repo-level Claude guidance is split across:
  - `CLAUDE.md` for repo rules and implementation constraints
  - `CONTEXT.md` for product brain, decision factors, and triggers
  - `MEMORY.md` for continuously updated working memory

## Current Constraints
- Production API URL in `src/config/api.ts` is still a placeholder.
- Backend environment data exists in `backend/.env` and should never be copied into docs or memory files.

## Recurring Gotchas
- Auth regressions often involve token storage and role persistence falling out of sync.
- Property lifecycle changes usually require both backend logic updates and frontend status/UI updates.
- API shape changes often require matching updates in `src/api/` and backend DTO/service/controller code.

## Open Follow-Ups
- None currently.

## Recent Changes
- `2026-04-02`: Added `CLAUDE.md` as the canonical Claude Code repo instruction file.
- `2026-04-02`: Added `.claude/settings.json` with shared project permissions and `.gitignore` support for `.claude/settings.local.json`.
- `2026-04-02`: Added `CONTEXT.md` for product-level decision guidance.

## Memory Hygiene
- Keep this file short enough to stay useful.
- Promote stable rules to `CLAUDE.md` if they become implementation policy.
- Promote product judgment patterns to `CONTEXT.md` if they become general decision guidance.
- Keep only current, high-value memory here.
