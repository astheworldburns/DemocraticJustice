---
layout: layout.njk
title: "Dark Mode Regression Testing"
description: "Verify the dark theme with DOM-level Playwright assertions instead of screenshots."
intent: guide
tasks:
  - testing
  - qa
permalink: /docs/dark-mode-testing/
intentOrder: 4
---

# Dark Mode Regression Testing

The dark theme is now verified with DOM-level assertions instead of screenshot comparisons. The Playwright spec at `tests/dark-mode.spec.js` loads the homepage with the dark theme enabled and inspects computed styles for critical UI regions.

## How the Test Works
- Forces the theme preference to `dark` before any page scripts execute.
- Confirms the `<html>` element applies `data-theme="dark"`.
- Checks computed background and text colors for `body`, the primary navigation bar, and the first rendered proof card.
- Ensures interactive links in the navigation and proof card inherit the light text color expected in dark mode.

These assertions target CSS variables so regressions in the palette or class selectors are caught immediately without relying on binary diffs.

## Running the Test Suite
1. Install dependencies (once per environment):
   ```bash
   npm install
   npm run test:browsers
   ```
2. Execute the dark-mode check:
   ```bash
   npm test
   ```
   or run only this spec:
   ```bash
   npm run test:dark
   ```

Playwright starts the Eleventy dev server automatically. No manual screenshot curation is required, and the repository contains no `.png` baselines or snapshot folders.
