import { DBContext } from "../../../../types/db-context";
import { Notification } from "../entities/notification.entity";
import { Result } from "../../../../core/Result";

export interface INotificationRepository {
    findByUserId(userId: string, dbOrTx?: DBContext): Promise<Result<Notification[]>>;
    findById(id: string, dbOrTx?: DBContext): Promise<Result<Notification | null>>;
    save(notification: Notification, dbOrTx?: DBContext): Promise<Result<void>>;
}
