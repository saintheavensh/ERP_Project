import { performance } from 'perf_hooks';
import { container } from '../src/container';
import { TYPES as PRODUCT_TYPES } from '../src/modules/products/types';
import { productsContainerModule } from '../src/modules/products/products-container';
import { Container } from 'inversify';
import { DrizzleClient } from '../src/shared/infrastructure/database/DrizzleClient';

/**
 * Simple performance test script
 * 
 * Run with: bun run scripts/performance-test.ts
 */

async function measureQuery(name: string, fn: () => Promise<any>, iterations: number = 10) {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`${name}:`);
    console.log(`  Avg: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
}

async function runPerformanceTests() {
    console.log('🚀 Running Performance Tests\n');

    const testContainer = new Container();
    testContainer.load(productsContainerModule);
    // Bind DrizzleClient explicitly if not already bound or ensure it resolves
    if (!testContainer.isBound(PRODUCT_TYPES.DrizzleClient)) {
        testContainer.bind(PRODUCT_TYPES.DrizzleClient).to(DrizzleClient).inSingletonScope();
    }

    const productRepo = testContainer.get<any>(PRODUCT_TYPES.IProductRepository);

    // Test pagination performance
    await measureQuery('Find all products (paginated)', async () => {
        return productRepo.findAllPaginated({ page: 1, limit: 20 });
    });

    // Test search performance
    await measureQuery('Search products', async () => {
        return productRepo.searchProducts('test', { page: 1, limit: 20 });
    });

    // Test with different pagination sizes
    console.log('\n📊 Pagination Size Comparison:');
    for (const limit of [10, 20, 50, 100]) {
        await measureQuery(`  Limit ${limit}`, async () => {
            return productRepo.findAllPaginated({ page: 1, limit });
        }, 5);
    }
}

runPerformanceTests().catch(console.error).finally(() => process.exit(0));
