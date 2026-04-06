---
name: pr-review
description: Reviews an AqaryaApp pull request for correctness, API contract drift, and release risk.
disable-model-invocation: true
---

Review PR: $ARGUMENTS

1. Run `gh pr view $ARGUMENTS` for context.
2. Run `gh pr diff $ARGUMENTS` and read every changed file in full context.
3. Use the `code-reviewer` agent for the deep review.
4. Run the smallest relevant verification:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
   - `npm --prefix backend run build` if backend files changed
5. Report findings in `CRITICAL`, `WARNING`, `SUGGESTION` format.
6. End with either:
   - `APPROVED TO MERGE`
   - `MERGE BLOCKED — [reason]`
