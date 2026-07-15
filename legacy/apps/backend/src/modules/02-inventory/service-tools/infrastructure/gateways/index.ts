import type { TransactionContext } from "../../../../../shared/types/db-context";
import { messagingFacade } from "../../../../../shared/infrastructure/messaging";
import { usersService } from "../../../../05-shared/users/users-container";
import { INotificationGateway, IUserGateway } from "../../domain";
import { logger } from "@shared/logging/AppLogger";

export class NotificationGatewayAdapter implements INotificationGateway {
    async notifyOwnersNewToolRequest(technicianName: string, toolName: string): Promise<void> {
        try {
            const owners = await usersService.findAll("owner");

            for (const owner of owners) {
                await messagingFacade.sendNotification({
                    userId: owner.id,
                    title: "Permintaan Alat Baru",
                    content: `Teknisi ${technicianName} meminta alat baru: ${toolName}`,
                    type: "service_tool_request",
                    channel: "internal"
                });
            }
        } catch (error) {
            logger.error("Failed to send tool request notifications", { service: "inventory", tenantId: "unknown", requestId: "unknown" }, { error });
        }
    }
}

export class UserGatewayAdapter implements IUserGateway {
    async getOwners(_tx: TransactionContext): Promise<Array<{ id: string; name: string }>> {
        // Note: usersService.findAll is a cross-module call that doesn't use tx.
        // The tx parameter is accepted for interface consistency but not used here
        // because the users module manages its own DB access.
        const owners = await usersService.findAll("owner");
        return owners.map((o) => ({ id: o.id, name: o.name ?? "Unknown" }));
    }
}
