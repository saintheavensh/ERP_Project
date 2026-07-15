import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Script to add logging to use cases
 * 
 * Run with: bun run scripts/migrate-logging.ts
 */

const USE_CASES_DIR = 'src/modules';

function addLoggingToUseCase(filePath: string) {
    let content = readFileSync(filePath, 'utf-8');

    // Add LoggerFactory import if not present
    if (!content.includes('LoggerFactory') && !content.includes('logger')) {
        content = content.replace(
            /(import .+;\n)/,
            '$1import { LoggerFactory } from "../../../shared/utils/logger/Logger";\n'
        );
    }

    // Add logger property to class
    if (!content.includes('private logger:')) {
        const classMatch = content.match(/export class (\w+)UseCase/);
        if (classMatch) {
            const className = classMatch[1];

            // Add logger property after constructor params
            content = content.replace(
                /(constructor\([^)]+\)\s*{)/,
                `$1\n        this.logger = loggerFactory.createLogger('${className}UseCase');`
            );

            // Add loggerFactory to constructor params
            content = content.replace(
                /(constructor\([^)]+)\)/,
                '$1, @inject(TYPES.LoggerFactory) private loggerFactory: LoggerFactory)'
            );
        }
    }

    // Add context parameter to execute method
    content = content.replace(
        /(async execute\([^)]+)\): Promise<Result/,
        '$1, context?: { requestId?: string; userId?: string }): Promise<Result'
    );

    // Add child logger creation at start of execute
    content = content.replace(
        /(async execute\([^)]+\): Promise<Result[^>]+> \{[^}]*\n)/,
        '$1        const log = context ? this.logger.child(context) : this.logger;\n'
    );

    // Add log statements before returns
    content = content.replace(
        /(return Result\.ok\([^)]+\);\n(?!\s*\/\/ log))/g,
        '        log.info(\'Operation successful\');\n        $1'
    );

    writeFileSync(filePath, content);
    console.log(`✅ Migrated logging: ${filePath}`);
}

// Find all use case files
const findUseCases = (dir: string) => {
    const files = readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = join(dir, file.name);
        if (file.isDirectory()) {
            findUseCases(fullPath);
        } else if (file.name.endsWith('UseCase.ts')) {
            addLoggingToUseCase(fullPath);
        }
    }
};

findUseCases(USE_CASES_DIR);
console.log('✨ Logging migration complete!');
