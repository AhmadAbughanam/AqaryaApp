# Aqarya - Competition Submission Notes

## One-Line Pitch

Aqarya is a bilingual trusted digital property service for Jordan that helps citizens buy, rent, sell, and evaluate property with SANAD-style identity, DLS-style verification, admin oversight, notifications, and tamper-evident audit records.

## Problem

Property transactions are high-value, slow, and trust-sensitive. Citizens often need to verify ownership, listing legitimacy, seller identity, and transaction history before making decisions. Without a clear digital service layer, this process can feel fragmented, unclear, and vulnerable to fraud or misinformation.

## Solution

Aqarya brings property trust workflows into one mobile-first government-service concept:

- Citizens can browse verified buy and rent listings.
- Citizens can list owned properties for sale through a verification pipeline.
- Citizens can evaluate approved investment opportunities with clear risk and trust indicators.
- Admin teams can review listings, opportunities, reports, providers, notifications, and content from one operational dashboard.
- Audit logs, notifications, and blockchain-backed verification records make review decisions traceable.

## Why It Is A Government Service

Aqarya is not positioned as a private marketplace first. It is a digital public-service concept for property trust in Jordan. It models how government-facing property services can connect citizen identity, land-record verification, and administrative oversight into a single trusted mobile flow.

The current implementation uses SANAD-style and DLS-style flows to demonstrate integration readiness. It does not claim live production integration with SANAD or the Department of Lands and Survey unless those services are later connected through official APIs.

## Key Citizen Flows

- First-time intro and bilingual login.
- Buy, rent, and invest discovery modes.
- Verified public listing detail with ownership, verification, and blockchain record context.
- Citizen-owned property listing for sale.
- Saved listings, saved searches, and notifications.
- Messages and inquiry workflows.
- Profile preferences for Arabic/English and notifications.

## Key Admin / Government Flows

- Dashboard with operational KPIs.
- Property verification queue with approve, reject, request changes, freeze, and anchor actions.
- Investment opportunity review with approve, reject, publish, and unpublish actions.
- User and provider verification management.
- Moderation queue for citizen reports and quality flags.
- Audit log for accountability.
- Analytics dashboard covering property, investment, provider, moderation, messaging, and CMS metrics.
- Announcements and help-content management.

## Innovation

- Combines property discovery with trust-first government workflows.
- Separates buy, rent, sell, and invest logic instead of mixing them.
- Uses audit logs and blockchain-backed record references for tamper-evident accountability.
- Adds provider verification, moderation, and quality flags.
- Provides Arabic/English user experience for citizen accessibility.

## Impact

Aqarya can reduce fraud risk, improve citizen confidence, shorten manual verification loops, and give government teams clearer oversight of property-related digital services.

The highest-impact story for judging is simple: citizens should not have to guess whether a property listing or investment opportunity is trustworthy. Aqarya makes trust visible, reviewable, and auditable.

## Scalability And Sustainability

The system is built as a full-stack app:

- React Native mobile frontend.
- NestJS API backend.
- Prisma data model and migrations.
- PostgreSQL database.
- Seeded demo data.
- E2E tests for critical backend flows.
- Admin operations for moderation, content, notifications, analytics, and auditability.

This makes the concept easier to extend toward official integrations, larger datasets, provider onboarding, and future deployment environments.

## App Functionality

Implemented functionality includes:

- Citizen app shell with Home, Map, Properties, Messages, and Profile.
- Buy/rent listing browse and detail flows.
- Citizen-owned property sale listing flow.
- Investment opportunity browse, detail, and simulation flow.
- Saved items, saved searches, notifications, and messaging.
- Admin review, moderation, provider management, analytics, audit logs, announcements, and content management.
- Arabic/English language support.

## Team Collaboration Notes

Use this section in the submission deck to describe the team contribution model:

- Product and government-service framing:
- Mobile frontend implementation:
- Backend/API implementation:
- Database/schema and seed data:
- Testing and verification:
- Pitch, demo, and presentation:

## Integration Honesty

For judging, use precise wording:

- Say "SANAD-style identity flow" unless there is an official SANAD integration.
- Say "DLS-style property verification" unless there is an official DLS integration.
- Say "blockchain-backed verification record references" or "tamper-evident audit trail" instead of implying a production government blockchain network.

This keeps the pitch strong while avoiding overclaiming.
