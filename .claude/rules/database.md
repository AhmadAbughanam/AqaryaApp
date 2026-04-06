---
paths:
  - "backend/prisma/**"
---

# AqaryaApp Database Rules

## Schema source of truth
- `backend/prisma/schema.prisma` is the canonical data model.
- Make schema changes through Prisma migrations, not ad hoc database edits.
- Update seeds and affected e2e tests when enums, roles, or required fields change.

## Integrity
- Preserve foreign keys and required relations for users, properties, investments, and audits.
- Add indexes for new foreign keys and heavily filtered fields.
- Avoid destructive changes without a clear backfill or migration story.

## Domain safety
- Keep `sale` and `investment` data models distinct where behavior differs.
- Verification, purchase, and freeze states must remain representable and enforceable in the schema.
- Do not rely on client-side checks for financial or ownership rules.
