
import { db } from "../../shared/infrastructure/database/client";
import { notifications } from "../../shared/infrastructure/database/schema";

async function main() {
    console.log("🔔 Sending test notification...");

    // Matches the ID we used in seed.ts
    const userId = "user-admin-001";

    await db.insert(notifications).values({
        userId: userId,
        type: "service_update",
        title: "Test Notification",
        message: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
        isRead: false,
    });

    console.log("✅ Notification inserted into Database!");
    console.log("👀 Check your Frontend - it should appear instantly.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
