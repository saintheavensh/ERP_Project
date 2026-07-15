import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/modules/**/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./pos_v2.db',
  },
  verbose: true,
  strict: true,
});
