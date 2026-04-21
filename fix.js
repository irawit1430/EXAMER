const fs = require('fs');
const content = fs.readFileSync('src/lib/agent/tools.ts', 'utf8');
const regex = /error instanceof Error\s*\?\s*error instanceof Error\s*\?\s*error\.message\s*:\s*String\(error\)/g;
const fixed = content.replace(regex, 'error instanceof Error ? error.message');
fs.writeFileSync('src/lib/agent/tools.ts', fixed);
