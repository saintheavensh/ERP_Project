import { db } from "../seed/index";
import { users } from "../../shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";

async function check() {
    const admin = await db.query.users.findFirst({
        where: eq(users.username, "admin")
    });

    if (!admin) {
        console.log("❌ Admin user not found!");
        return;
    }

    console.log("Found admin:", admin.id, admin.username);

    const isValid = await Bun.password.verify("123456", admin.password);
    console.log("Password '123456' valid?", isValid);

    if (!isValid) {
        console.log("⚠️ Password invalid. Resetting...");
        const newHash = await Bun.password.hash("123456");
        await db.update(users).set({ password: newHash }).where(eq(users.id, admin.id));
        console.log("✅ Password reset to '123456'");

        // Double check
        const admin2 = await db.query.users.findFirst({ where: eq(users.username, "admin") });
        const valid2 = await Bun.password.verify("123456", admin2!.password);
        console.log("Re-verification:", valid2);
    }
}

check().catch(console.error);
