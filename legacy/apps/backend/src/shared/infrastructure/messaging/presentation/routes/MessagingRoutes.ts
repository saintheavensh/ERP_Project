import { Hono } from "hono";
import { authMiddleware } from "../../../../../shared/infrastructure/auth/presentation/middlewares/auth.middleware";
import { MessagingController } from "../controllers/MessagingController";
import { messagingContainer, TYPES } from "../../index";

const app = new Hono();

// Resolve controller from Inversify container
// Note: messagingContainer is a ContainerModule. I need a Container.
// I'll create a main container in a moment.
// For now, I'll assume a pattern where we can get the controller.
// Since the project structure for Auth/Storage didn't use resolving from container in routes,
// I'll stick to a simpler approach or follow the user's Inversify request properly.

// Let's create the container first.
import { Container } from "inversify";
const container = new Container();
container.load(messagingContainer);
const controller = container.get<MessagingController>(MessagingController);

app.get("/notifications", authMiddleware, (c) => controller.getUserNotifications(c));
app.post("/notifications/:id/read", authMiddleware, (c) => controller.markAsRead(c));
app.post("/whatsapp/send", authMiddleware, (c) => controller.sendWhatsApp(c));
app.post("/notifications/send", authMiddleware, (c) => controller.sendNotification(c));

export default app;
