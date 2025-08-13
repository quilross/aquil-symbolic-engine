const fs = require('fs');
const path = require('path');

const specPath = path.join(__dirname, '..', 'worker', 'openapi-core.yaml');
const outputPath = path.join(__dirname, '..', 'worker', 'src', 'openapi.js');

const spec = fs.readFileSync(specPath, 'utf8');
const escapedSpec = spec.replace(/`/g, '\\`');
const content = [
  '// AUTO-GENERATED FROM openapi-core.yaml -- DO NOT EDIT',
  'export const openapi = `',
  escapedSpec,
  '`;',
].join('\n');
fs.writeFileSync(outputPath, content);
console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
