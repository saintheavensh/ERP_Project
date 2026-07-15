import { db } from "../../shared/infrastructure/database/client";
import { users } from "../../shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";
async function check() {
    console.log("Checking DB...");
    const user = await db.query.users.findFirst({
        where: eq(users.username, "superadmin")
    });
    console.log("Superadmin user:", user);
    process.exit(0);
}
check();
