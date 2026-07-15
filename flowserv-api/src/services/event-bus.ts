import { EventEmitter } from 'node:events';

// In a real distributed system, this could be Redis Pub/Sub, RabbitMQ, or Kafka.
// For this monolith backend, Node's EventEmitter is perfectly fine and adheres to the architecture.

export const eventBus = new EventEmitter();

// Define known events to enforce typing
export enum AppEvent {
  TICKET_STAGE_CHANGED = 'ticket.stage.changed',
  TICKET_CREATED = 'ticket.created',
  PART_CONSUMED = 'inventory.part.consumed',
  PAYMENT_RECEIVED = 'finance.payment.received'
}

export function emitEvent(event: AppEvent, payload: unknown) {
  eventBus.emit(event, payload);
}

// Example usage:
// import { eventBus, AppEvent } from './event-bus';
// eventBus.on(AppEvent.TICKET_STAGE_CHANGED, (payload) => {
//   console.log('Ticket stage changed!', payload);
// });
