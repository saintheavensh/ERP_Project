import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  unique,
  index,
  uniqueIndex,
  primaryKey,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { tenants, branches, users, roles, rolePermissions, userRoleAssignments } from './core';
import { flowTemplates, flowNodes, flowTransitions } from './flow';
import { customers, customerAssets, serviceTickets, ticketStageHistory, approvalRequests } from './tickets';
import { inventoryCategories, inventoryItems, itemBrandPricing, stockLevels, stockMovements, stockBatches, suppliers, supplierBrands, supplierInvoices, supplierPayments, purchaseOrders, purchaseOrderLines } from './inventory';
import { deviceBrands, deviceModels, productCompatibility, partBrands, productSuppliers } from './product_catalog';
import { paymentMethods } from './payment_methods__settings_';
import { auditLogs } from './audit_log';
import { printerDevices, printerTemplates, printerAssignments } from './printer';
import { posInvoices, posInvoiceLines } from './pos';

// ==========================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  users: many(users),
  roles: many(roles),
  flowTemplates: many(flowTemplates),
  inventoryItems: many(inventoryItems),
  customers: many(customers),
  serviceTickets: many(serviceTickets),
  auditLogs: many(auditLogs),
  printerDevices: many(printerDevices),
  printerTemplates: many(printerTemplates),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  serviceTickets: many(serviceTickets),
  stockLevels: many(stockLevels),
  printerDevices: many(printerDevices),
  printerAssignments: many(printerAssignments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  roleAssignments: many(userRoleAssignments),
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));

export const printerDevicesRelations = relations(printerDevices, ({ one, many }) => ({
  branch: one(branches, { fields: [printerDevices.branchId], references: [branches.id] }),
  assignments: many(printerAssignments),
}));

export const printerTemplatesRelations = relations(printerTemplates, ({ many }) => ({
  assignments: many(printerAssignments),
}));

export const printerAssignmentsRelations = relations(printerAssignments, ({ one }) => ({
  branch: one(branches, { fields: [printerAssignments.branchId], references: [branches.id] }),
  device: one(printerDevices, { fields: [printerAssignments.printerDeviceId], references: [printerDevices.id] }),
  template: one(printerTemplates, { fields: [printerAssignments.printerTemplateId], references: [printerTemplates.id] }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, { fields: [roles.tenantId], references: [tenants.id] }),
  rolePermissions: many(rolePermissions),
}));

export const flowTemplatesRelations = relations(flowTemplates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [flowTemplates.tenantId], references: [tenants.id] }),
  nodes: many(flowNodes),
}));

export const flowNodesRelations = relations(flowNodes, ({ one, many }) => ({
  flowTemplate: one(flowTemplates, { fields: [flowNodes.flowTemplateId], references: [flowTemplates.id] }),
  transitionsFrom: many(flowTransitions, { relationName: 'fromNode' }),
  transitionsTo: many(flowTransitions, { relationName: 'toNode' }),
}));

export const flowTransitionsRelations = relations(flowTransitions, ({ one }) => ({
  fromNode: one(flowNodes, { fields: [flowTransitions.fromNodeId], references: [flowNodes.id], relationName: 'fromNode' }),
  toNode: one(flowNodes, { fields: [flowTransitions.toNodeId], references: [flowNodes.id], relationName: 'toNode' }),
}));

export const serviceTicketsRelations = relations(serviceTickets, ({ one, many }) => ({
  tenant: one(tenants, { fields: [serviceTickets.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [serviceTickets.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [serviceTickets.customerId], references: [customers.id] }),
  customerAsset: one(customerAssets, { fields: [serviceTickets.customerAssetId], references: [customerAssets.id] }),
  flowTemplate: one(flowTemplates, { fields: [serviceTickets.flowTemplateId], references: [flowTemplates.id] }),
  currentNode: one(flowNodes, { fields: [serviceTickets.currentNodeId], references: [flowNodes.id] }),
  stageHistory: many(ticketStageHistory),
  approvalRequests: many(approvalRequests),
  stockMovements: many(stockMovements),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  tenant: one(tenants, { fields: [inventoryItems.tenantId], references: [tenants.id] }),
  partBrand: one(partBrands, { fields: [inventoryItems.partBrandId], references: [partBrands.id] }),
  category: one(inventoryCategories, { fields: [inventoryItems.categoryId], references: [inventoryCategories.id] }),
  stockLevels: many(stockLevels),
  stockMovements: many(stockMovements),
  stockBatches: many(stockBatches),
  compatibility: many(productCompatibility),
  productSuppliers: many(productSuppliers),
  brandPricing: many(itemBrandPricing),
}));

export const itemBrandPricingRelations = relations(itemBrandPricing, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [itemBrandPricing.inventoryItemId], references: [inventoryItems.id] }),
  partBrand: one(partBrands, { fields: [itemBrandPricing.partBrandId], references: [partBrands.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [stockMovements.inventoryItemId], references: [inventoryItems.id] }),
  stockBatch: one(stockBatches, { fields: [stockMovements.stockBatchId], references: [stockBatches.id] }),
  serviceTicket: one(serviceTickets, { fields: [stockMovements.serviceTicketId], references: [serviceTickets.id] }),
}));

export const stockBatchesRelations = relations(stockBatches, ({ one, many }) => ({
  inventoryItem: one(inventoryItems, { fields: [stockBatches.inventoryItemId], references: [inventoryItems.id] }),
  partBrand: one(partBrands, { fields: [stockBatches.partBrandId], references: [partBrands.id] }),
  supplier: one(suppliers, { fields: [stockBatches.supplierId], references: [suppliers.id] }),
  purchaseOrderLine: one(purchaseOrderLines, { fields: [stockBatches.purchaseOrderLineId], references: [purchaseOrderLines.id] }),
  movements: many(stockMovements),
}));

export const deviceBrandsRelations = relations(deviceBrands, ({ many }) => ({
  deviceModels: many(deviceModels),
}));

export const deviceModelsRelations = relations(deviceModels, ({ one, many }) => ({
  deviceBrand: one(deviceBrands, { fields: [deviceModels.deviceBrandId], references: [deviceBrands.id] }),
  compatibility: many(productCompatibility),
}));

export const productCompatibilityRelations = relations(productCompatibility, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [productCompatibility.inventoryItemId], references: [inventoryItems.id] }),
  deviceModel: one(deviceModels, { fields: [productCompatibility.deviceModelId], references: [deviceModels.id] }),
}));

export const partBrandsRelations = relations(partBrands, ({ many }) => ({
  inventoryItems: many(inventoryItems),
  supplierBrands: many(supplierBrands),
}));

export const productSuppliersRelations = relations(productSuppliers, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [productSuppliers.inventoryItemId], references: [inventoryItems.id] }),
  supplier: one(suppliers, { fields: [productSuppliers.supplierId], references: [suppliers.id] }),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  tenant: one(tenants, { fields: [stockLevels.tenantId], references: [tenants.id] }),
  inventoryItem: one(inventoryItems, { fields: [stockLevels.inventoryItemId], references: [inventoryItems.id] }),
  branch: one(branches, { fields: [stockLevels.branchId], references: [branches.id] }),
}));

export const inventoryCategoriesRelations = relations(inventoryCategories, ({ many }) => ({
  inventoryItems: many(inventoryItems),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [purchaseOrders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [purchaseOrders.branchId], references: [branches.id] }),
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  purchaseOrderLines: many(purchaseOrderLines),
  supplierInvoices: many(supplierInvoices),
}));

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one, many }) => ({
  tenant: one(tenants, { fields: [purchaseOrderLines.tenantId], references: [tenants.id] }),
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderLines.purchaseOrderId], references: [purchaseOrders.id] }),
  inventoryItem: one(inventoryItems, { fields: [purchaseOrderLines.inventoryItemId], references: [inventoryItems.id] }),
  stockBatches: many(stockBatches),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  productSuppliers: many(productSuppliers),
  purchaseOrders: many(purchaseOrders),
  stockBatches: many(stockBatches),
  supplierBrands: many(supplierBrands),
}));

export const supplierBrandsRelations = relations(supplierBrands, ({ one }) => ({
  supplier: one(suppliers, { fields: [supplierBrands.supplierId], references: [suppliers.id] }),
  partBrand: one(partBrands, { fields: [supplierBrands.partBrandId], references: [partBrands.id] }),
}));

export const posInvoicesRelations = relations(posInvoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [posInvoices.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [posInvoices.branchId], references: [branches.id] }),
  serviceTicket: one(serviceTickets, { fields: [posInvoices.serviceTicketId], references: [serviceTickets.id] }),
  creator: one(users, { fields: [posInvoices.createdBy], references: [users.id] }),
  lines: many(posInvoiceLines),
}));

export const posInvoiceLinesRelations = relations(posInvoiceLines, ({ one }) => ({
  posInvoice: one(posInvoices, { fields: [posInvoiceLines.posInvoiceId], references: [posInvoices.id] }),
  inventoryItem: one(inventoryItems, { fields: [posInvoiceLines.inventoryItemId], references: [inventoryItems.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  tenant: one(tenants, { fields: [paymentMethods.tenantId], references: [tenants.id] }),
}));

export const supplierInvoicesRelations = relations(supplierInvoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [supplierInvoices.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [supplierInvoices.branchId], references: [branches.id] }),
  supplier: one(suppliers, { fields: [supplierInvoices.supplierId], references: [suppliers.id] }),
  purchaseOrder: one(purchaseOrders, { fields: [supplierInvoices.purchaseOrderId], references: [purchaseOrders.id] }),
  payments: many(supplierPayments),
}));

export const supplierPaymentsRelations = relations(supplierPayments, ({ one }) => ({
  tenant: one(tenants, { fields: [supplierPayments.tenantId], references: [tenants.id] }),
  supplierInvoice: one(supplierInvoices, { fields: [supplierPayments.supplierInvoiceId], references: [supplierInvoices.id] }),
  createdBy: one(users, { fields: [supplierPayments.createdBy], references: [users.id] }),
}));
