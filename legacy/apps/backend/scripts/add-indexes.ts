import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Script to add missing indexes to schema files
 * 
 * Run with: bun run scripts/add-indexes.ts
 */

const SCHEMA_DIRS = [
    'src/modules/products/infrastructure/schema',
    'src/modules/categories/infrastructure/schema',
    'src/modules/inventory/infrastructure/schema',
    'src/modules/sales/infrastructure/schema',
    'src/modules/purchases/infrastructure/schema',
    'src/modules/accounting/infrastructure/schema',
    'src/shared/infrastructure/auth/infrastructure/schema',
    'src/shared/infrastructure/config/infrastructure/schema',
    'src/shared/infrastructure/messaging/infrastructure/schema',
    'src/shared/infrastructure/external-api/devices/infrastructure/schema',
];

const INDEX_PATTERNS = [
    { field: 'userId', type: 'index' },
    { field: 'storeId', type: 'index' },
    { field: 'productId', type: 'index' },
    { field: 'categoryId', type: 'index' },
    { field: 'supplierId', type: 'index' },
    { field: 'status', type: 'index' },
    { field: 'email', type: 'index' },
    { field: 'sku', type: 'index' },
    { field: 'code', type: 'index' },
    { field: 'referenceId', type: 'index' },
    { field: 'parentId', type: 'index' },
    { field: 'createdAt', type: 'index' },
    { field: 'updatedAt', type: 'index' },
    { field: 'deletedAt', type: 'index' }
];

function addIndexesToFile(filePath: string) {
    let content = readFileSync(filePath, 'utf-8');

    // Extract table name
    const tableMatch = content.match(/export const (\w+)\s*=\s*pgTable\(/);
    if (!tableMatch) return false;

    const tableName = tableMatch[1];

    // Find fields that need indexes
    const indexes: string[] = [];
    for (const { field, type } of INDEX_PATTERNS) {
        if (content.includes(`${field}:`) && !content.includes(`index("${tableName}_${field}_idx"`)) {
            // Check if we already import index
            if (!content.includes(' index ') && !content.includes(', index ') && !content.includes(', index,')) {
                // VERY naive import injection, might need manual fixing if it breaks syntax
                content = content.replace(/import {([^}]+)} from "drizzle-orm\/pg-core";/, (match, p1) => {
                    return `import {${p1}, index } from "drizzle-orm/pg-core";`;
                });
            }
            indexes.push(`        ${field}Idx: ${type}("${tableName}_${field}_idx").on(table.${field})`);
        }
    }

    if (indexes.length === 0) return false;

    // Check if table has a trailing comma or existing closure
    // Often it's }, (table) => ({ ... })); or just });
    if (content.match(/},\s*\(\w+\)\s*=>\s*\({/)) {
        // Already has an index block
        const indexSection = `\n${indexes.join(',\n')},`;
        content = content.replace(/(},\s*\(\w+\)\s*=>\s*\({)/, `$1${indexSection}`);
    } else {
        // Does not have an index block
        const indexSection = `\n}, (table) => ({\n${indexes.join(',\n')}\n}));`;
        content = content.replace(/}\);\s*$/, indexSection);
    }

    writeFileSync(filePath, content);
    return true;
}

// Run the script
let totalModified = 0;
for (const dir of SCHEMA_DIRS) {
    try {
        const files = readdirSync(dir);
        for (const file of files) {
            if (file.endsWith('Schema.ts') || file.endsWith('schema.ts')) {
                const filePath = join(dir, file);
                if (addIndexesToFile(filePath)) {
                    console.log(`✅ Added indexes to ${file}`);
                    totalModified++;
                }
            }
        }
    } catch (e) {
        // Directory might not exist
    }
}

console.log(`\n✨ Total files modified: ${totalModified}`);
