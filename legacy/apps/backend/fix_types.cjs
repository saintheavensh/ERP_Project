const fs = require('fs');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
    'src/shared/infrastructure/config/application/use-cases/GetSettingUseCase.ts',
    'src/shared/infrastructure/config/application/use-cases/UpdateSettingUseCase.ts',
    'src/shared/infrastructure/config/application/use-cases/GetModuleSettingsUseCase.ts',
    'src/shared/infrastructure/config/infrastructure/persistence/DrizzleSettingRepository.ts',
    'src/shared/infrastructure/config/config.container.ts'
];

for (const file of files) {
    replaceInFile(file, [
        [/import\s*{\s*ISettingRepository\s*}\s*from/g, 'import type { ISettingRepository } from'],
        [/import\s*{\s*SettingScope\s*}\s*from/g, 'import type { SettingScope } from']
    ]);
}
