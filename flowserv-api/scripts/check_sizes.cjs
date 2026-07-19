const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../src/routes');
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.ts')) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').length;
    console.log(f.padEnd(20) + ': ' + lines + ' lines');
  }
});
