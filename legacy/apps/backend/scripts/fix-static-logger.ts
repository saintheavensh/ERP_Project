import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Script to fix static Logger.error / Logger.info calls in legacy code
 * 
 * Run with: bun run scripts/fix-static-logger.ts
 */

const DIRS_TO_SCAN = ['src/shared', 'src/modules', 'src/services'];

function fixStaticLogger(filePath: string) {
    let content = readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // Convert Logger.error(...) to new Logger("Legacy").error(...)
    if (content.match(/Logger\.error\(/g)) {
        content = content.replace(/Logger\.error\(/g, 'new Logger("Legacy").error(');
        hasChanges = true;
    }

    if (content.match(/Logger\.info\(/g)) {
        content = content.replace(/Logger\.info\(/g, 'new Logger("Legacy").info(');
        hasChanges = true;
    }

    if (content.match(/Logger\.warn\(/g)) {
        content = content.replace(/Logger\.warn\(/g, 'new Logger("Legacy").warn(');
        hasChanges = true;
    }

    if (content.match(/Logger\.debug\(/g)) {
        content = content.replace(/Logger\.debug\(/g, 'new Logger("Legacy").debug(');
        hasChanges = true;
    }

    if (hasChanges) {
        writeFileSync(filePath, content);
        console.log(`✅ Fixed static logger: ${filePath}`);
    }
}

// Find all ts files
const findFiles = (dir: string) => {
    try {
        const files = readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
            const fullPath = join(dir, file.name);
            if (file.isDirectory() && file.name !== 'test' && file.name !== '__tests__') {
                findFiles(fullPath);
            } else if (file.name.endsWith('.ts')) {
                fixStaticLogger(fullPath);
            }
        }
    } catch (e) {
        // Directory might not exist, ignore
    }
};

DIRS_TO_SCAN.forEach(dir => findFiles(dir));
console.log('✨ Static logger fix complete!');
