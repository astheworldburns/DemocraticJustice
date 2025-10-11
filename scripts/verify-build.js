const fs = require('fs');
const path = require('path');

const criticalFiles = [
  '_site/index.html',
  '_site/style.css',
  '_site/bundle.js',
  '_site/pagefind/pagefind.js'
];

let hasErrors = false;

for (const file of criticalFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing critical file: ${file}`);
    hasErrors = true;
    continue;
  }

  const stats = fs.statSync(fullPath);
  if (!stats.size) {
    console.error(`❌ Empty file: ${file}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exitCode = 1;
} else {
  console.log('✅ Build verification passed');
}
