import { inject, injectable } from "inversify";
import { Context } from "hono";
import { DashboardAggregator } from "../services/DashboardAggregator";
import { TYPES } from "../../../../shared/core/types";

@injectable()
export class DashboardController {
    constructor(
        @inject(TYPES.DashboardAggregator) private aggregator: DashboardAggregator
    ) { }

    async getStats(c: Context) {
        const timeRange = {
            startDate: c.req.query('start') ? new Date(c.req.query('start')!) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: c.req.query('end') ? new Date(c.req.query('end')!) : new Date(),
            period: (c.req.query('period') as any) || 'week'
        };

        const result = await this.aggregator.getDashboardStats(timeRange);

        if (result.isFailure) {
            return c.json({ error: result.errorValue() }, 500);
        }

        return c.json(result.getValue());
    }

    async getSalesChart(c: Context) {
        const timeRange = {
            startDate: new Date(c.req.query('start')!),
            endDate: new Date(c.req.query('end')!),
            period: c.req.query('period') as any || 'day'
        };

        const result = await this.aggregator.getSalesChart(timeRange);

        if (result.isFailure) {
            return c.json({ error: result.errorValue() }, 500);
        }

        return c.json(result.getValue());
    }

    async getInventoryAlerts(c: Context) {
        const result = await this.aggregator.getInventoryAlerts();

        if (result.isFailure) {
            return c.json({ error: result.errorValue() }, 500);
        }

        return c.json(result.getValue());
    }
}
