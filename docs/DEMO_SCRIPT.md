# Aqarya Demo Script

## Demo Principle

Lead with government trust, not marketplace breadth. Judges should understand Aqarya as a trusted digital property service for Jordan before seeing optional investment or advanced admin features.

## Two-Minute Demo Path

1. Intro screen
   - Say: "Aqarya is a bilingual digital property service for Jordan. It helps citizens interact with property services through SANAD-style identity, DLS-style verification, and admin oversight."

2. Login screen
   - Show English/Arabic toggle and SANAD sign-in affordance.
   - Say: "The app is designed for Arabic and English citizens, with secure government-linked sign-in positioning."

3. Citizen Home
   - Show Buy / Rent / Invest modes briefly.
   - Say: "The citizen sees services as clear journeys: buy, rent, sell, and invest. The core is verified property trust."

4. Public listing detail
   - Open a verified listing.
   - Point to verification, owner/source, and blockchain/audit record fields.
   - Say: "Citizens can see whether the property passed verification instead of relying on untrusted claims."

5. Citizen property sale flow
   - Navigate to owned properties / list property for sale.
   - Say: "When a citizen lists a property, it does not go public blindly. It enters a verification pipeline."

6. Admin dashboard
   - Log in as admin or switch to prepared admin session.
   - Show pending reviews, moderation, analytics, and audit.
   - Say: "The government/admin side has queues, review actions, notifications, audit logs, and analytics."

7. Closing
   - Say: "Aqarya turns property trust into a digital public service: verified records for citizens and accountable oversight for administrators."

## Five-Minute Demo Path

1. Intro and login
   - Show the government-service intro.
   - Switch EN/AR.
   - Mention SANAD-style sign-in and DLS-style verification readiness.

2. Citizen Home
   - Show Buy / Rent / Invest segmented control.
   - Emphasize that modes are separated to keep business rules clear.

3. Verified listing detail
   - Open a buy or rent listing.
   - Highlight verified badge, seller/source, property details, save/report actions, and blockchain verification context.

4. Citizen owned property sale
   - Open Properties / My Properties.
   - Start listing an owned property for sale.
   - Explain ownership proof and verification status.

5. Notifications and messages
   - Show that citizens receive updates and can use inquiry/support flows.
   - Keep this short.

6. Admin property verification
   - Open admin dashboard.
   - Open property review.
   - Show request changes / approve / reject style workflow.
   - Mention audit trail and citizen notification.

7. Moderation and provider trust
   - Open moderation queue or user/provider management.
   - Say: "Government teams can review reports, providers, and quality flags from the same operations surface."

8. Analytics and audit
   - Open analytics or audit logs.
   - Say: "The system gives administrators measurable oversight, not just forms."

9. Investment as extension
   - If time allows, show investment opportunity detail.
   - Frame it as "government-supervised transparency for approved opportunities," not as the main product.

10. Close
   - Say: "Aqarya improves citizen confidence by making property verification, review decisions, and trust signals visible and auditable."

## Exact Screen Order For Main Demo

1. Intro screen
2. Login screen
3. Citizen Home
4. Public Listing Detail
5. Properties / My Properties
6. Sell Property form
7. Notifications
8. Admin Dashboard
9. Property Verification / Admin Property Detail
10. Audit Logs or Analytics
11. Optional: Moderation Queue
12. Optional: Investment Opportunity Detail

## Fallback Plan

If the backend fails:

- Use the already-open emulator state if available.
- Show seeded/static screens that load from dev fallback data where possible.
- Switch to screenshots or a short recorded video if prepared.
- Keep the pitch focused on the implemented architecture and tested flows.

If the emulator fails:

- Show screenshots/video.
- Walk through the GitHub README and docs.
- Mention that backend e2e tests cover the critical administrative workflows.

If login fails:

- Restart backend and confirm API URL.
- Use seeded credentials:
  - `citizen / 123456`
  - `admin / 123456`

## What Not To Demo Unless Asked

- Do not lead with investment.
- Do not spend time on every admin module.
- Do not discuss private marketplace monetization first.
- Do not overclaim live production SANAD/DLS integration.
- Do not show raw database or code unless judges ask technical questions.

## Judge-Facing Phrases

- "Aqarya is a trusted digital property service, not only a marketplace."
- "The citizen sees verified records; the admin sees accountable workflows."
- "Blockchain is used as an auditability concept, not as hype."
- "SANAD-style and DLS-style flows show how the service is ready for official integration."
- "The core government value is reducing fraud risk and improving transparency."
