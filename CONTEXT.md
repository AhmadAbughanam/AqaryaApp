# Aqarya Context Brain

## Purpose
This file defines the product brain for Claude in this repository.

Use `CLAUDE.md` for repository rules, file locations, commands, and implementation constraints.
Use `CONTEXT.md` for product intent, decision factors, and triggers that should shape Claude's judgment before making changes.

## Product Identity
- Aqarya is not just a property listing app.
- It is a trust-sensitive property platform with regulated-style workflows around ownership, verification, auditability, and role-based access.
- The product should feel credible, structured, and operationally reliable.
- Features should support user trust, data clarity, and workflow consistency more than novelty.

## Core Product Mental Model
- Citizens need simple, clear flows for browsing, buying, investing, and managing their property activity.
- Admins need operational control over verification, audit review, analytics, and lifecycle enforcement.
- The backend is the source of truth for business rules, ownership state, verification status, investment calculations, and audit events.
- The mobile app should present backend truth clearly rather than inventing parallel business logic.

## Primary Business Goals
- Make property transactions and investment flows understandable.
- Reduce ambiguity around listing state, ownership state, and verification state.
- Preserve trust in admin review and blockchain-related verification flows.
- Keep role-based experiences focused: citizen screens should stay task-oriented, admin screens should stay operational.
- Avoid accidental regressions in auth, lifecycle, or data-contract behavior.

## Decision Factors
When Claude has multiple valid implementation options, prioritize in this order:

1. Business-rule correctness
- Property and investment workflows must remain valid.
- Verification, lifecycle, and ownership rules are more important than UI convenience.

2. Contract consistency
- Frontend, backend, DTOs, types, and displayed labels should agree.
- If data meaning changes, reflect it across all affected layers.

3. User trust
- Prefer clear statuses, explicit messaging, and predictable actions.
- Avoid misleading UI states, optimistic assumptions, or hidden side effects.

4. Role clarity
- Citizen and admin responsibilities should stay separate.
- Do not expose admin logic casually in citizen flows or vice versa.

5. Minimal change surface
- Solve the problem without broad refactors unless the task explicitly demands it.

6. Maintainability
- Reuse existing patterns, components, and backend service structure.

## Product-Specific Truths
- A property can belong to a sale flow or an investment flow; these are distinct and should remain distinct.
- Verification state is not cosmetic. It controls visibility, trust, and workflow progression.
- Audit logs are product behavior, not just technical logging.
- Blockchain anchoring and verification metadata are domain signals and should not be treated as placeholder decoration when editing related code.
- Auth is role-bearing. A token without the correct persisted role is an incomplete session.

## Claude Behavior Triggers

### Trigger: Auth change
If the task touches login, logout, token restore, unauthorized handling, or role persistence:
- Re-check auth storage, auth context, API client unauthorized handling, and route gating together.
- Assume regressions here are high-risk.

### Trigger: Navigation change
If a screen is added, moved, renamed, or gated:
- Re-check route params, stack definitions, role access, and entry points from existing screens.

### Trigger: User-facing text change
If labels, alerts, status copy, CTA text, or helper text change:
- Prefer centralized strings where appropriate.
- Preserve trust-sensitive wording around SANAD, verification, listing state, and financial outcomes.

### Trigger: Property lifecycle change
If the task affects property creation, sale listing, purchase, freezing, verification, rejection, or visibility:
- Re-check backend property logic, admin actions, status badges, relevant screens, and audit implications.
- Assume mobile and backend both need review.

### Trigger: Investment logic change
If the task affects shares, pricing, returns, simulation, or ownership percentage:
- Treat the backend as the canonical source.
- Re-check API contracts and frontend result presentation.

### Trigger: Admin workflow change
If the task affects verification queues, analytics, audit logs, or freeze/anchor actions:
- Preserve operational clarity.
- Verify the action has a corresponding state transition and user-visible result where needed.

### Trigger: Prisma or schema change
If the task affects the database model:
- Check schema, migrations, seed data, backend services, DTOs, and e2e tests.

### Trigger: API contract change
If request or response shapes change:
- Update both backend and mobile client types in the same pass.
- Check all screens or hooks consuming the changed contract.

### Trigger: Status or enum change
If a status, role, or enum value is added or renamed:
- Search the entire repo.
- Assume UI badges, filters, backend guards, analytics, and tests may all need updates.

## Heuristics For Good Decisions
- Prefer explicit states over inferred magic.
- Prefer consistent naming over clever shortcuts.
- Prefer one source of truth over duplicated transformations.
- Prefer business-safe defaults over permissive behavior.
- Prefer surfacing meaningful errors over silently swallowing domain failures.

## Heuristics For UI Decisions
- The interface should feel reliable and deliberate, not playful or experimental.
- Financial, ownership, and verification information should be easy to scan.
- Statuses and next actions should be obvious.
- Admin UI should optimize for operational throughput and clarity.
- Citizen UI should optimize for confidence, clarity, and low-friction actions.

## Heuristics For Backend Decisions
- Keep business rules in services, not scattered through controllers or frontend assumptions.
- Guard invalid state transitions explicitly.
- Write or update audit records when lifecycle actions materially change state.
- Preserve type and validation accuracy around financial and ownership fields.

## Red Flags
If any of these appear, Claude should slow down and inspect more broadly:
- A change seems simple but touches auth, roles, statuses, or ownership.
- A frontend-only fix appears to compensate for backend inconsistency.
- A new field duplicates an existing concept with slightly different naming.
- Sale and investment logic start sharing behavior that should remain separate.
- UI copy implies certainty that the backend does not actually guarantee.
- `backend/dist/` looks easier to patch than source files.

## Preferred Outcome
The best changes in this repo usually have these qualities:
- they keep citizen and admin experiences coherent
- they preserve trust in property and investment workflows
- they align mobile behavior with backend truth
- they make statuses, actions, and outcomes easier to understand
- they avoid unnecessary architectural churn
