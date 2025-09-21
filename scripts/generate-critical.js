#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const os = require('os');

async function main() {
  const { generate } = await import('critical');
  const projectRoot = path.resolve(__dirname, '..');
  const siteDir = path.join(projectRoot, '_site');
  const htmlPath = path.join(siteDir, 'index.html');
  const cssPath = path.join(siteDir, 'style.css');
  const outputPath = path.join(projectRoot, '_includes', 'critical.css');

  if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
    const playwrightCache = path.join(os.homedir(), '.cache', 'ms-playwright');
    try {
      const entries = fs.readdirSync(playwrightCache, {withFileTypes: true});
      for (const entry of entries) {
        if (!entry.isDirectory() || !entry.name.startsWith('chromium')) {
          continue;
        }

        const candidate = path.join(playwrightCache, entry.name, 'chrome-linux', 'chrome');
        if (fs.existsSync(candidate)) {
          process.env.PUPPETEER_EXECUTABLE_PATH = candidate;
          break;
        }
      }
    } catch {}
  }

  if (!fs.existsSync(htmlPath)) {
    console.error(`Missing generated HTML at ${htmlPath}. Run Eleventy before extracting critical CSS.`);
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(cssPath)) {
    console.error(`Missing compiled stylesheet at ${cssPath}.`);
    process.exitCode = 1;
    return;
  }

  try {
    const result = await generate({
      base: siteDir,
      src: 'index.html',
      css: [cssPath],
      inline: false,
      dimensions: [
        { width: 375, height: 720 },
        { width: 1280, height: 960 },
      ],
      extract: false,
      rebase: false,
    });

    const criticalCss = (typeof result === 'string' ? result : result.css || '').trim();

    if (!criticalCss) {
      console.warn('critical: Generated CSS was empty. Existing inline styles were left untouched.');
      return;
    }

    fs.writeFileSync(outputPath, `${criticalCss}\n`, 'utf8');
    console.log(`critical: Wrote hero CSS to ${path.relative(projectRoot, outputPath)} (${criticalCss.length} bytes).`);
  } catch (error) {
    console.error('critical: Failed to extract CSS');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
