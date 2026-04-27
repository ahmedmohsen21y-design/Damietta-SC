#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = __dirname;
const dataRoot = path.join(root, '_data');
const folders = ['board', 'esports', 'jobs', 'news', 'players', 'products', 'tickets'];

for (const folder of folders) {
  const dir = path.join(dataRoot, folder);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith('.json') && name !== 'index.json')
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ files }, null, 2) + '\n', 'utf8');
  console.log(`Updated ${folder}/index.json (${files.length} files)`);
}
