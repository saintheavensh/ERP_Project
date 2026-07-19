import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../src/db/schema.ts');
const outDir = path.join(__dirname, '../src/db/schema');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const content = fs.readFileSync(schemaPath, 'utf8');
const lines = content.split('\n');

const imports: string[] = [];
let i = 0;
while (i < lines.length) {
  if (lines[i].startsWith('import')) {
    let importBlock = lines[i];
    if (!importBlock.includes(';')) {
      while (i < lines.length && !lines[i].includes(';')) {
        i++;
        importBlock += '\n' + lines[i];
      }
    }
    imports.push(importBlock);
  }
  if (lines[i].startsWith('// ====')) {
    break; // stop at first section
  }
  i++;
}

interface Section {
  name: string;
  filename: string;
  content: string[];
  exports: string[];
}

const sections: Section[] = [];
let currentSection: Section | null = null;

const mapTitleToFile = (title: string) => {
  if (title.includes('CORE PLATFORM')) return 'core';
  if (title.includes('FLOW ENGINE')) return 'flow';
  if (title.includes('CUSTOMER & SERVICE')) return 'tickets';
  if (title.includes('INVENTORY')) return 'inventory';
  if (title.includes('PURCHASING')) return 'purchasing';
  if (title.includes('FINANCE')) return 'finance';
  if (title.includes('POS')) return 'pos';
  if (title.includes('PRINTER')) return 'printer';
  return title.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

while (i < lines.length) {
  if (lines[i].startsWith('// ====') && i + 1 < lines.length && lines[i+1].startsWith('// ')) {
    const title = lines[i+1].replace('// ', '').split(':')[0].trim();
    currentSection = { 
      name: title, 
      filename: mapTitleToFile(title),
      content: [],
      exports: [] 
    };
    sections.push(currentSection);
    i += 3; // skip the ====, title, ====
    continue;
  }
  if (currentSection) {
    currentSection.content.push(lines[i]);
    // Detect exports
    const exportMatch = lines[i].match(/^export const ([a-zA-Z0-9_]+) =/);
    if (exportMatch) {
      currentSection.exports.push(exportMatch[1]);
    }
  }
  i++;
}

// Map of tableName -> filename
const exportMap = new Map<string, string>();
for (const sec of sections) {
  for (const exp of sec.exports) {
    exportMap.set(exp, sec.filename);
  }
}

const importsString = imports.join('\n');
const indexExports: string[] = [];

for (const sec of sections) {
  const contentStr = sec.content.join('\n');
  
  // Find needed imports from other files
  const neededImports = new Map<string, Set<string>>(); // filename -> Set of table names
  
  for (const [exp, filename] of exportMap.entries()) {
    if (filename !== sec.filename) {
      // Regex to match exact word boundary
      const regex = new RegExp(`\\b${exp}\\b`, 'g');
      if (regex.test(contentStr)) {
        if (!neededImports.has(filename)) {
          neededImports.set(filename, new Set());
        }
        neededImports.get(filename)!.add(exp);
      }
    }
  }

  let crossImports = '';
  for (const [filename, exps] of neededImports.entries()) {
    crossImports += `import { ${Array.from(exps).join(', ')} } from './${filename}';\n`;
  }

  const fileContent = importsString + '\n\n' + crossImports + '\n' + contentStr;
  fs.writeFileSync(path.join(outDir, `${sec.filename}.ts`), fileContent);
  indexExports.push(`export * from './${sec.filename}';`);
}

fs.writeFileSync(path.join(outDir, 'index.ts'), indexExports.join('\n') + '\n');

console.log('Schema split successfully with cross-imports resolved!');
