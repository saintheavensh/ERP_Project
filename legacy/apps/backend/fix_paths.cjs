const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// 1. GetSettingUseCase.ts
replaceInFile('src/shared/infrastructure/config/application/use-cases/GetSettingUseCase.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/types['"]/g, '"../../../../../types"'],
    [/['"]\.\.\/domain\/ports\/ISettingRepository['"]/g, '"../../domain/ports/ISettingRepository"'],
    [/['"]\.\.\/domain\/entities\/Setting\.entity['"]/g, '"../../domain/entities/Setting.entity"']
]);

// 2. UpdateSettingUseCase.ts
replaceInFile('src/shared/infrastructure/config/application/use-cases/UpdateSettingUseCase.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/types['"]/g, '"../../../../../types"'],
    [/['"]\.\.\/domain\/ports\/ISettingRepository['"]/g, '"../../domain/ports/ISettingRepository"'],
    [/['"]\.\.\/domain\/entities\/Setting\.entity['"]/g, '"../../domain/entities/Setting.entity"']
]);

// 3. GetModuleSettingsUseCase.ts
replaceInFile('src/shared/infrastructure/config/application/use-cases/GetModuleSettingsUseCase.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/types['"]/g, '"../../../../../types"'],
    [/['"]\.\.\/domain\/ports\/ISettingRepository['"]/g, '"../../domain/ports/ISettingRepository"']
]);

// 4. ConfigFacade.ts
replaceInFile('src/shared/infrastructure/config/application/facades/ConfigFacade.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/types['"]/g, '"../../../../../types"'],
    [/['"]\.\.\/AppConfig['"]/g, '"../../AppConfig"']
]);

// 5. DrizzleSettingRepository.ts
replaceInFile('src/shared/infrastructure/config/infrastructure/persistence/DrizzleSettingRepository.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/types['"]/g, '"../../../../../types"']
]);

// 6. ConfigController.ts
replaceInFile('src/shared/infrastructure/config/presentation/controllers/ConfigController.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/types['"]/g, '"../../../../../types"']
]);

// 7. config.routes.ts
replaceInFile('src/shared/infrastructure/config/presentation/routes/config.routes.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/types['"]/g, '"../../../../../types"'],
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/container['"]/g, '"../../../../../container"']
]);

// 8. GetSettingUseCase.test.ts
replaceInFile('src/shared/infrastructure/config/application/__tests__/GetSettingUseCase.test.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/core\/Result['"]/g, '"../../../../core/Result"']
]);

// 9. ConfigController.test.ts
replaceInFile('src/shared/infrastructure/config/presentation/__tests__/ConfigController.test.ts', [
    [/['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/core\/Result['"]/g, '"../../../../core/Result"']
]);
