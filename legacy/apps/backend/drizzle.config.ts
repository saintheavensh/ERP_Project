import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/shared/infrastructure/database/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://coba_user:coba_pass@localhost:5432/coba_db",
    },
});
