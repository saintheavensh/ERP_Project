import { db } from '../connection';

// The type of the `tx` argument inside db.transaction(async (tx) => {...}).
// Every seed/*.ts module takes this instead of importing `db` directly, so
// all seed writes share one transaction (index.ts wraps the whole run in one).
export type SeedTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
