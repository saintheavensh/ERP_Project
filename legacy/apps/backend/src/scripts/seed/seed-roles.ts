import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { roles } from '../../shared/infrastructure/database/schema';

dotenv.config();

const INITIAL_ROLES = [
    {
        id: 'admin',
        name: 'Administrator'
    },
    {
        id: 'teknisi',
        name: 'Teknisi'
    },
    {
        id: 'kasir',
        name: 'Kasir'
    }
];

async function seedRoles() {
    console.log('🌱 Seeding Roles...');

    if (!process.env.DIRECT_URL) {
        console.error('❌ DIRECT_URL is required for seeding');
        process.exit(1);
    }

    try {
        const client = postgres(process.env.DIRECT_URL);
        const db = drizzle(client);

        for (const role of INITIAL_ROLES) {
            await db.insert(roles)
                .values(role)
                .onConflictDoUpdate({
                    target: roles.id,
                    set: {
                        name: role.name,
                        createdAt: new Date()
                    }
                });
            console.log(`✅ Seeded role: ${role.id}`);
        }

        console.log('🎉 Role seeding completed successfully!');
        await client.end();
    } catch (error) {
        console.error('❌ Error seeding roles:', error);
        process.exit(1);
    }
}

seedRoles();
