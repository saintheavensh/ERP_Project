
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, 'src/routes/(authenticated)/superadmin');

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            if (file.endsWith('.svelte') || file.endsWith('.ts')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const files = getAllFiles(rootDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix imports from (manager), (warehouse), (kasir) - needs ../../../ instead of ../../
    content = content.replace(/"\.\.\/\.\.\/\(manager\)/g, '"../../../(manager)');
    content = content.replace(/"\.\.\/\.\.\/\(warehouse\)/g, '"../../../(warehouse)');
    content = content.replace(/"\.\.\/\.\.\/\(kasir\)/g, '"../../../(kasir)');

    // Fix imports from service - needs ../../service instead of ../service
    // Only if it looks like "../service/" not "../../service/"
    content = content.replace(/"\.\.\/service\//g, '"../../service/');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
    }
});

console.log('Fix complete.');
