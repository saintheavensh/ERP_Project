import { Hono } from 'hono';
import { container } from '../../../../shared/core/container';
import { TYPES } from '../../../../shared/core/types';
import { DashboardController } from '../controllers/DashboardController';

export const dashboardRoutes = new Hono();

const getController = () => container.get<DashboardController>(TYPES.DashboardController);

// Dashboard stats
dashboardRoutes.get('/stats', (c) => getController().getStats(c));

// Charts
dashboardRoutes.get('/charts/sales', (c) => getController().getSalesChart(c));

// Alerts
dashboardRoutes.get('/alerts/inventory', (c) => getController().getInventoryAlerts(c));
