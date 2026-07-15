import { Database } from "bun:sqlite";

const db = new Database("sqlite.db");

try {
    console.log("Creating purchase_returns table...");
    db.run(`
        CREATE TABLE IF NOT EXISTS "purchase_returns" (
            "id" text PRIMARY KEY NOT NULL,
            "supplier_id" text NOT NULL REFERENCES "suppliers"("id"),
            "user_id" text NOT NULL REFERENCES "users"("id"),
            "date" integer DEFAULT CURRENT_TIMESTAMP,
            "notes" text,
            "created_at" integer DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Creating purchase_return_items table...");
    db.run(`
        CREATE TABLE IF NOT EXISTS "purchase_return_items" (
            "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
            "return_id" text NOT NULL REFERENCES "purchase_returns"("id"),
            "product_id" text NOT NULL REFERENCES "products"("id"),
            "batch_id" text NOT NULL REFERENCES "product_batches"("id"),
            "qty" integer NOT NULL,
            "reason" text,
            "created_at" integer DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Tables created successfully!");
} catch (e) {
    console.error("Error creating tables:", e);
} finally {
    db.close();
}
