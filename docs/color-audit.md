# Color Token Accessibility Audit

## Overview
This audit reviews the existing light and dark color tokens to confirm WCAG 2.1 AA contrast compliance for body text, link states, surfaces, and focus indicators. The analysis followed the recommended workflow of mapping neutral and accent scales to semantic roles, then validating each role across `prefers-color-scheme` modes.

## Key Adjustments
- Increased the contrast hierarchy for the light theme's secondary text tokens so "muted", "subtle", and "soft" text now remain above the 4.5:1 ratio on both `color-surface-page` and `color-surface-muted` backgrounds.
- Brightened the dark theme's secondary text tokens using controlled blends of the neutral scale to keep them perceptually soft while ensuring ≥4.5:1 contrast on page and raised surfaces.
- Strengthened the shared focus ring token to `--color-primary-600` in light mode to meet the 3:1 contrast guidance for visible focus indicators.

## Contrast Validation
The following tables summarize the measured contrast ratios for the updated tokens. Measurements were calculated with sRGB relative luminance and rounded to two decimals.

### Light Mode Text Tokens
| Token | Hex (computed) | Surface: Page (`#f1f5f9`) | Surface: Raised (`#ffffff`) | Surface: Muted (`#e2e8f0`) |
|-------|----------------|---------------------------|-----------------------------|----------------------------|
| `--color-text-base` | `#1e293b` | 13.35 | 14.63 | 11.87 |
| `--color-text-muted` | `#334155` | 9.45 | 10.35 | 8.40 |
| `--color-text-subtle` | `#475569` | 6.92 | 7.58 | 6.15 |
| `--color-text-soft` | `#5a697f` | 5.10 | 5.58 | 4.53 |

### Dark Mode Text Tokens
| Token | Hex (computed) | Surface: Page (`#0f172a`) | Surface: Raised (`#1e293b`) |
|-------|----------------|---------------------------|-----------------------------|
| `--color-text-base` | `#f1f5f9` | 16.30 | 13.35 |
| `--color-text-muted` | `#dae1eb` | 13.56 | 11.11 |
| `--color-text-subtle` | `#b2becf` | 9.49 | 7.77 |
| `--color-text-soft` | `#a7b4c6` | 8.49 | 6.96 |

### Focus & Link States
- Focus ring (light mode): `#2563eb` yields a 4.72:1 contrast on the default page background.
- Focus ring (dark mode): `#60a5fa` retains a 7.02:1 contrast on the dark page background.
- Link roles inherit the primary scale in both themes and remain ≥4.7:1 against their respective page backgrounds.

## Recommendations & Next Steps
1. **Interactive States** – Confirm hover, active, and disabled states for buttons, chips, and navigation items inherit the updated tokens; regression tests should include keyboard focus and high-contrast OS settings.
2. **Imagery & Icons** – Audit SVGs and raster artwork for "on-dark" variants so glyphs maintain separation from `color-surface-raised` in dark mode.
3. **Real Device Validation** – Review both themes on calibrated and consumer displays in bright sun and low-light settings to catch haloing or color-shift issues that automated contrast tools can miss.
4. **Token Governance** – Continue to evolve semantic tokens (background, surface, text, border, status) rather than component-level overrides, and prefer HSL or OKLCH driven shade ladders for future palette growth.

These updates bring the typography, link, and focus foundations of both themes into WCAG AA compliance while preserving the intended hierarchy between strong, muted, and supporting text roles.
