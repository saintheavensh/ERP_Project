import { decimal } from 'drizzle-orm/pg-core';

/** All monetary values use one precision. IDR needs the range; scale 2 covers cents. */
export const money = (name: string) => decimal(name, { precision: 14, scale: 2 });
