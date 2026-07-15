
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target nested directories specifically
const dirs = [
    path.resolve(__dirname, 'src/routes/(authenticated)/superadmin/sales/history'),
    path.resolve(__dirname, 'src/routes/(authenticated)/superadmin/settings/employees'),
    path.resolve(__dirname, 'src/routes/(authenticated)/superadmin/settings/notes'),
    path.resolve(__dirname, 'src/routes/(authenticated)/superadmin/settings/payment'),
    path.resolve(__dirname, 'src/routes/(authenticated)/superadmin/settings/service'),
    path.resolve(__dirname, 'src/routes/(authenticated)/superadmin/settings/store')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Directory not found: ${dir}`);
        return;
    }

    console.log(`Processing ${dir}...`);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.svelte') || f.endsWith('.ts'));

    files.forEach(file => {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Ensure imports have enough ../ levels
        // These are 4 levels deep from routes root: superadmin/sales/history -> ../../../../
        // Current wrong imports might be ../../../

        // (manager), (warehouse), (kasir)
        content = content.replace(/(['"])\.\.\/\.\.\/\.\.\/\(manager\)/g, '$1../../../../(manager)');
        content = content.replace(/(['"])\.\.\/\.\.\/\.\.\/\(warehouse\)/g, '$1../../../../(warehouse)');
        content = content.replace(/(['"])\.\.\/\.\.\/\.\.\/\(kasir\)/g, '$1../../../../(kasir)');

        if (content !== original) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated: ${file}`);
        }
    });
});

console.log('Nested fix complete.');
