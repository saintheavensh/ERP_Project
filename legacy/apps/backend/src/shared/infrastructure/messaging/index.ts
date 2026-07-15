import { Container } from "inversify";
import { messagingContainer } from "./MessagingContainer";
export { messagingContainer };
import { MessagingFacade } from "./application/facades/MessagingFacade";
import { TYPES } from "../../core/types";

// Create a standalone container for external access if needed, or just export the module
const container = new Container();
container.load(messagingContainer);

export const messagingFacade = container.get<MessagingFacade>(TYPES.MessagingFacade);

export * from "./application/facades/MessagingFacade";
export * from "./domain";
export { TYPES } from "../../core/types";
export * from "../../core/types";
