# Asset Guide

This app uses local static images for branding, placeholders, city cards, property cards, and detail-page heroes.

## Main Rule

Do not import images directly from screens with `require('../../assets/...')`.

Use the central registry instead:

```ts
import {AppImages} from '../../assets/images';

<Image source={AppImages.logos.aqarya} />
```

The registry lives at:

```text
src/assets/images/index.ts
```

## Current Image Groups

```text
src/assets/images/
├── index.ts                         # Central registry used by the app
├── brand/                           # Aqarya and SANAD logos
├── backgrounds/                     # Login/profile background images
├── placeholders/                    # Generic placeholders
├── onboarding/                      # Intro/onboarding images
├── cities/                          # City card hero images
├── property/
│   ├── sale/                        # Sale listing placeholders
│   ├── rent/                        # Rent listing placeholders
│   └── investment/                  # Investment listing placeholders
└── archives/                        # Local-only legacy/source exports ignored by Git
```

## Registry Shape

`AppImages` is grouped by usage:

```ts
AppImages.logos.aqarya
AppImages.logos.sanad
AppImages.backgrounds.introSplash
AppImages.backgrounds.jordanMap
AppImages.backgrounds.profileHero
AppImages.placeholders.profileAvatar
AppImages.cities.Amman
AppImages.property.sale.mapThumb
AppImages.property.rent.detailHero
AppImages.property.investment.opportunityHero
```

## Adding A New Image

1. Put the file under the closest existing folder in `src/assets/images/`.
2. Add a named entry in `src/assets/images/index.ts`.
3. Import `AppImages` from the screen or component.
4. Use the named registry entry.
5. Run `npm run typecheck`.

## Moving Or Renaming Images

If an image file is moved, update only `src/assets/images/index.ts` whenever possible. Screens should not need path changes.

Metro requires static `require()` calls, so avoid dynamic image paths such as:

```ts
require(`./${name}.png`)
```

Use an explicit map in the registry instead.

## File Naming

Prefer descriptive names that include the intended use and dimensions when useful:

```text
map-thumb-84x84.png
detail-hero-390x220.png
full-width-390x190.png
listing-thumb-110x118.png
```

Use lowercase folder names for new folders. Existing folders with older names should be renamed only in a dedicated cleanup commit, because React Native image moves can be easy to break.

## What Not To Commit

Do not commit generated archives or source design files unless they are intentionally part of the project. The local archive folder is ignored by Git:

```text
src/assets/images/archives/
```

- `.zip`
- `.psd`
- `.ai`
- large raw exports
- unused duplicate image sets

For release builds, also never commit APKs, AABs, keystores, or signing passwords.
