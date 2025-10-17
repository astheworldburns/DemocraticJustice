#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const postcss = require('postcss');

const allowedVariableNames = new Set([
  '--color-gray-100',
  '--color-gray-200',
  '--color-gray-300',
  '--color-gray-400',
  '--color-gray-500',
  '--color-gray-600',
  '--color-gray-700',
  '--color-gray-800',
  '--color-gray-900',
  '--color-primary-400',
  '--color-primary-500',
  '--color-primary-600',
  '--color-primary-700',
  '--color-primary-800',
  '--color-primary-900',
  '--color-white',
  '--color-black',
  '--color-text-base',
  '--color-text-muted',
  '--color-text-subtle',
  '--color-text-strong',
  '--color-text-on-primary',
  '--color-surface-page',
  '--color-surface-muted',
  '--color-surface-raised',
  '--color-surface-subtle',
  '--color-surface-divider',
  '--color-interactive-primary',
  '--color-interactive-primary-hover',
  '--color-interactive-primary-active',
  '--color-interactive-primary-border',
  '--color-link-active',
  '--brand',
  '--navy',
  '--white',
  '--text-muted',
  '--ink-strong',
  '--color-interactive-neutral',
  '--color-border-soft',
  '--color-border-subtle',
  '--color-border-strong',
  '--color-border-contrast',
  '--color-border-accent',
  '--shadow-sm',
  '--shadow-md',
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-7',
  '--space-8',
  '--space-9',
  '--paragraph-gap',
  '--font-size-sm',
  '--line-height-sm',
  '--font-size-base',
  '--line-height-base',
  '--font-size-lg',
  '--line-height-lg',
  '--font-size-xl',
  '--line-height-xl',
  '--font-size-2xl',
  '--line-height-2xl',
  '--font-size-3xl',
  '--line-height-3xl',
  '--line-height-heading',
]);

const variableContainerSelectors = new Set([':root', '[data-theme="dark"]']);

const allowedExactSelectors = new Set([
  '.btn',
  '.btn-outline-white',
  '.btn-outline-white:hover',
  '.btn-outline-white:active',
  '.btn-accent',
  '.btn-accent:hover',
  '.btn-accent:active',
  '.btn-outline-blue',
  '.btn-outline-blue:hover',
  '.btn-outline-blue:active',
  '.btn-primary',
  '.btn-secondary',
  '.btn-secondary:hover',
  '.btn-secondary:focus-visible',
  '.btn-tertiary',
  '.btn-group',
]);

const allowedSelectorPatterns = [
  /^:root$/,
  /^\[data-theme="dark"\]$/,
  /^\[data-theme="dark"\]\s+body$/,
  /^\[data-theme="dark"\]\s+\.nav/,
  /^\[data-theme="dark"\]\s+\.nav-links/,
  /^\[data-theme="dark"\]\s+\.nav-toggle/,
  /^\[data-theme="dark"\]\s+\.wordmark/,
  /^body$/,
  /^\*$/,
  /^img$/,
  /^a(?::|$)/,
  /^:focus-visible$/,
  /^\.align-container\b/,
  /^\.skip/,
  /^\.nav/,
  /^\.nav--/,
  /^\.nav-inner\b/,
  /^\.logo-wrap\b/,
  /^\.nav-links/,
  /^\.nav-toggle/,
  /^\.nav-toggle-icon\b/,
  /^\.wordmark\b/,
  /^\.hero/,
];

const allowedKeyframes = new Set(['nav-cta-pulse']);

function selectorAllowed(selector) {
  const trimmed = selector.trim();
  return (
    allowedExactSelectors.has(trimmed) ||
    allowedSelectorPatterns.some((pattern) => pattern.test(trimmed))
  );
}

function filterCss(inputCss) {
  const ast = postcss.parse(inputCss);
  const seenSelectors = new Set();

  ast.walkComments((comment) => comment.remove());

  ast.walkAtRules((atRule) => {
    if (atRule.name === 'keyframes') {
      const name = atRule.params.trim();
      if (!allowedKeyframes.has(name)) {
        atRule.remove();
      }
    } else if (atRule.name !== 'media') {
      atRule.remove();
    }
  });

  ast.walkRules((rule) => {
    if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') {
      return;
    }

    if (!rule.selectors) {
      return;
    }

    const allowedSelectors = rule.selectors.filter(selectorAllowed);
    const parentType = rule.parent ? rule.parent.type : 'root';
    const uniqueSelectors = parentType === 'root'
      ? allowedSelectors.filter((selector) => {
          if (seenSelectors.has(selector)) {
            return false;
          }
          seenSelectors.add(selector);
          return true;
        })
      : allowedSelectors;

    if (!uniqueSelectors.length) {
      rule.remove();
      return;
    }

    rule.selectors = uniqueSelectors;

    const allVariables = uniqueSelectors.every((selector) =>
      variableContainerSelectors.has(selector.trim())
    );

    if (allVariables) {
      rule.walkDecls((decl) => {
        if (!allowedVariableNames.has(decl.prop)) {
          decl.remove();
        }
      });
    }

    if (!rule.nodes.length) {
      rule.remove();
    }
  });

  ast.walkAtRules((atRule) => {
    if ((atRule.name === 'media' || atRule.name === 'keyframes') && !atRule.nodes.length) {
      atRule.remove();
    }
  });

  return ast.toString().trim();
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const outputPath = path.join(projectRoot, '_includes', 'critical.css');
  const candidates = [
    path.join(projectRoot, '_site', 'style.css'),
    path.join(projectRoot, 'style.css'),
  ];

  const sourcePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!sourcePath) {
    console.error('critical: Unable to locate a stylesheet. Run the build to generate style.css.');
    process.exitCode = 1;
    return;
  }

  const css = fs.readFileSync(sourcePath, 'utf8');
  const filtered = filterCss(css);

  if (!filtered) {
    console.warn('critical: Filtered CSS was empty. Existing inline styles were left untouched.');
    return;
  }

  fs.writeFileSync(outputPath, `${filtered}\n`, 'utf8');
  console.log(
    `critical: Wrote trimmed CSS to ${path.relative(projectRoot, outputPath)} (${Buffer.byteLength(filtered, 'utf8')} bytes) from ${path.relative(projectRoot, sourcePath)}.`
  );
}

main().catch((error) => {
  console.error('critical: Failed to generate CSS');
  console.error(error);
  process.exitCode = 1;
});
