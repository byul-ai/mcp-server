// Ensure the CLI has a shebang and executable permissions
import fs from 'node:fs';
import path from 'node:path';

const cliPath = path.resolve(process.cwd(), 'dist', 'cli.js');

if (fs.existsSync(cliPath)) {
  const content = fs.readFileSync(cliPath, 'utf8');
  const shebang = '#!/usr/bin/env node\n';
  if (!content.startsWith('#!')) {
    fs.writeFileSync(cliPath, shebang + content, 'utf8');
  }
  try {
    fs.chmodSync(cliPath, 0o755);
  } catch {}
}


