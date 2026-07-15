import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Script to audit missing database indexes
 * 
 * Run with: bun run scripts/audit-indexes.ts
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

const FIELDS_THAT_NEED_INDEXES = [
    'userId', 'storeId', 'productId', 'categoryId', 'supplierId',
    'status', 'email', 'sku', 'code', 'referenceId', 'parentId',
    'createdAt', 'updatedAt', 'deletedAt'
];

function auditIndexes() {
    let totalTables = 0;
    let tablesWithIndexes = 0;
    let missingIndexes: Array<{ table: string; field: string; file: string }> = [];

    for (const dir of SCHEMA_DIRS) {
        try {
            const files = readdirSync(dir);
            for (const file of files) {
                if (!file.endsWith('Schema.ts') && !file.endsWith('schema.ts')) continue;
                if (file === 'index.ts') continue;

                const filePath = join(dir, file);
                const content = readFileSync(filePath, 'utf-8');

                // Extract table name
                const tableMatch = content.match(/export const (\w+) = pgTable\(/);
                if (!tableMatch || !tableMatch[1]) continue;

                const tableName = tableMatch[1];
                totalTables++;

                // Check if table has indexes defined
                const hasIndexes = content.includes('index(') || content.includes('.index(');
                if (hasIndexes) tablesWithIndexes++;

                // Check each field that needs index
                for (const field of FIELDS_THAT_NEED_INDEXES) {
                    // Simple check if the field exists in the table definition
                    if (content.includes(`${field}:`) && !content.includes(`index("${tableName}_${field}_idx"`)) {
                        missingIndexes.push({
                            table: tableName,
                            field,
                            file: filePath
                        });
                    }
                }
            }
        } catch (e) {
            // Directory might not exist yet
        }
    }

    console.log('📊 INDEX AUDIT REPORT');
    console.log('=====================');
    console.log(`Total tables: ${totalTables}`);
    console.log(`Tables with indexes: ${tablesWithIndexes}`);
    console.log(`Tables without indexes: ${totalTables - tablesWithIndexes}`);
    console.log('\n🔍 Missing Indexes:');

    if (missingIndexes.length === 0) {
        console.log('✅ No missing indexes found!');
    } else {
        missingIndexes.forEach(({ table, field, file }) => {
            console.log(`  - ${table}.${field} (in ${file})`);
        });
    }
}

auditIndexes();
