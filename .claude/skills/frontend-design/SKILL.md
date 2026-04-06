---
name: frontend-design
description: AqaryaApp mobile design guidance for the mint-and-forest visual system used across citizen and admin screens.
user-invocable: true
---

When designing or restyling AqaryaApp screens, match the existing React Native visual language instead of default template UI.

## Brand palette
- Background Primary: `#EEF5F0`
- Background Secondary: `#FFFFFF`
- Background Muted: `#D9EBE3`
- Primary: `#4A7C6F`
- Primary Dark: `#1A2E28`
- Primary Light: `#C8DDD4`
- Text Primary: `#1A2E28`
- Text Secondary: `#6B9E8F`
- Border: `#D9EBE3`
- Warning: `#D4A853`
- Error: `#C0544A`

## Visual direction
- Use airy mint backgrounds, white cards, and deep forest CTAs.
- Favor rounded cards and pill-shaped actions over sharp corners.
- Dark statistic cards should use `Primary Dark` or `cardDark` with white text.
- Keep contrast high and avoid flat grayscale controls.

## Layout and components
- Prefer generous horizontal padding and clean vertical spacing.
- Buttons should feel substantial, with rounded shapes and subtle press feedback.
- Cards should carry light shadows on pale surfaces and stronger contrast on dark surfaces.
- Status badges should use soft tinted backgrounds, not saturated blocks.

## React Native specifics
- Use `StyleSheet.create` for reusable styles.
- Pair iOS shadow properties with Android `elevation`.
- Use `Animated` or existing motion patterns for subtle feedback only.
- Do not introduce web-only assumptions like Tailwind classes, CSS variables, or HTML semantics.

## Product fit
- Citizen flows should feel welcoming and polished.
- Admin flows should stay clear and information-dense without losing the brand language.
- Preserve accessibility labels and readable text sizes during any redesign.
