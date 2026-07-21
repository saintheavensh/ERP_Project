import { EventEmitter } from 'node:events';

// In a real distributed system, this could be Redis Pub/Sub, RabbitMQ, or Kafka.
// For this monolith backend, Node's EventEmitter is perfectly fine and adheres to the architecture.

export const eventBus = new EventEmitter();

// Define known events to enforce typing
export enum AppEvent {
  TICKET_STAGE_CHANGED = 'ticket.stage.changed',
  TICKET_CREATED = 'ticket.created',
  PART_CONSUMED = 'inventory.part.consumed',
  PAYMENT_RECEIVED = 'finance.payment.received',
  // H11 — finance ledger posting triggers. Emitted after their owning
  // transaction commits (never from inside it) so a ledger failure can never
  // roll back a completed sale, consumption, or payment.
  POS_SALE_COMPLETED = 'pos.sale.completed',
  POS_SALE_VOIDED = 'pos.sale.voided',
  TICKET_PART_CONSUMED = 'ticket.part.consumed',
  SUPPLIER_INVOICE_CREATED = 'supplier.invoice.created',
  SUPPLIER_PAYMENT_RECORDED = 'supplier.payment.recorded',
  // H14 — a customer settling an instalment on a tempo pos_invoice. Never
  // posts revenue (that already happened in full at POS_SALE_COMPLETED) —
  // see ledger.ts's buildArSettlementEntry for why.
  CUSTOMER_PAYMENT_RECORDED = 'customer.payment.recorded',
}

export function emitEvent(event: AppEvent, payload: unknown) {
  eventBus.emit(event, payload);
}

export function onEvent<T = unknown>(event: AppEvent, handler: (payload: T) => void) {
  eventBus.on(event, handler);
}

// Example usage:
// import { eventBus, AppEvent } from './event-bus';
// eventBus.on(AppEvent.TICKET_STAGE_CHANGED, (payload) => {
//   console.log('Ticket stage changed!', payload);
// });
