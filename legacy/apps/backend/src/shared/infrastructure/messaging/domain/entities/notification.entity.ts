import { Entity } from "../../../../core/Entity";
import { Result } from "../../../../core/Result";

export type NotificationType =
    | "low_stock"
    | "service_update"
    | "new_assignment"
    | "sale_complete"
    | "purchase_complete"
    | "po_action_required"
    | "po_discrepancy"
    | "spend_alert";

export type NotificationChannel = 'email' | 'push' | 'whatsapp' | 'sms' | 'internal';

export interface NotificationProps {
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    content: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    entityType?: string;
    entityId?: string;
}

export class Notification extends Entity<NotificationProps> {
    get userId(): string { return this.props.userId; }
    get type(): NotificationType { return this.props.type; }
    get channel(): NotificationChannel { return this.props.channel; }
    get title(): string { return this.props.title; }
    get content(): string { return this.props.content; }
    get isRead(): boolean { return this.props.isRead; }
    get readAt(): Date | null { return this.props.readAt; }
    get createdAt(): Date { return this.props.createdAt; }
    get entityType(): string | undefined { return this.props.entityType; }
    get entityId(): string | undefined { return this.props.entityId; }

    public markAsRead(): void {
        if (!this.props.isRead) {
            this.props.isRead = true;
            this.props.readAt = new Date();
        }
    }

    public static create(
        props: Omit<NotificationProps, 'isRead' | 'readAt' | 'createdAt'>,
        id?: string
    ): Result<Notification> {
        return Result.ok(new Notification({
            ...props,
            isRead: false,
            readAt: null,
            createdAt: new Date()
        }, id));
    }
}
