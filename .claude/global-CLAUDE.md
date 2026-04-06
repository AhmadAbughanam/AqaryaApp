# ~/.claude/CLAUDE.md — Global Rules

## How to work with me
- Explore before coding on tasks that touch multiple files.
- Give me the verification commands you actually ran or recommend.
- Prefer subagents for bounded research so the main context stays clean.
- Never rewrite or revert my unrelated changes.

## Non-negotiable defaults
- Never push without explicit user approval.
- Fix root causes instead of hiding errors.
- Keep validation and tests aligned with the touched surface.
- Prefer existing project tools and patterns before adding new dependencies.

## Never do
- Do not read `.env` files unless I explicitly ask.
- Do not hardcode secrets, tokens, or production credentials.
- Do not use `git push --force`.
- Do not skip verification just to move faster.

## Starting bigger tasks
- Read the relevant files first.
- Write a brief plan before broad edits.
- Call out blockers caused by missing services, SDKs, or environment data.
