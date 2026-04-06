---
name: fix-issue
description: Fixes a GitHub issue for AqaryaApp by reading context, reproducing the bug, implementing the change, and verifying the right surfaces.
disable-model-invocation: true
---

Fix GitHub issue: $ARGUMENTS

1. Run `gh issue view $ARGUMENTS` and restate the issue in AqaryaApp terms.
2. Read every impacted mobile, backend, and Prisma file before editing.
3. Enter Plan Mode if the work touches 3 or more files.
4. Reproduce the bug with the smallest failing check available.
5. Fix the root cause only.
6. Run relevant verification:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
   - `npm --prefix backend run build` for backend changes
   - `npm --prefix backend run test:e2e` when backend behavior changed and local services are ready
7. Summarize exactly what changed and any skipped verification.
8. Commit only after all required checks pass.
9. Open a PR with `gh pr create` only if the user explicitly wants commit and push steps.
