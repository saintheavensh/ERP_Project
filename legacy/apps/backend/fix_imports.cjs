const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/shared/infrastructure/config/**/*.ts');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // Fix TYPES and container imports
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/\.\.\/types['"]/g, '"../../../../../types"');
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/\.\.\/container['"]/g, '"../../../../../container"');

    // Fix Result core import
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/core\/Result['"]/g, '"../../../../core/Result"');

    // ConfigFacade specific
    if (file.includes('ConfigFacade.ts')) {
        content = content.replace(/['"]\.\/use-cases\//g, '"../use-cases/');
        content = content.replace(/['"]\.\.\/AppConfig['"]/g, '"../../AppConfig"');
    }

    // use-cases specific
    if (file.includes('UseCase.ts')) {
        content = content.replace(/['"]\.\.\/domain\//g, '"../../domain/');
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
}
