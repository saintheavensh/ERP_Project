export class CommissionCalculator {
    static calculate(
        setting: any,
        serviceItem: any,
        serviceType: any
    ): number {
        if (!setting || !setting.isActive) return 0;

        switch (setting.commissionType) {
            case 'SIMPLE':
                return this.calculateSimple(setting, serviceItem);
            case 'WEIGHTED':
                return this.calculateWeighted(setting, serviceType);
            case 'MIX':
                return this.calculateMix(setting, serviceItem, serviceType);
            case 'SALARY':
                return 0; // Commission is 0 for purely salaried technicians per ticket
            default:
                return 0;
        }
    }

    private static calculateSimple(setting: any, serviceItem: any): number {
        const rate = parseFloat(setting.simpleRate) || 0;
        const baseAmount = serviceItem.actualCost || serviceItem.estimatedCost || 0;
        return (baseAmount * rate) / 100;
    }

    private static calculateWeighted(setting: any, serviceType: any): number {
        const weight = serviceType?.weight || 0;
        const valuePerPoint = setting.valuePerPoint || 0;
        return weight * valuePerPoint;
    }

    private static calculateMix(setting: any, serviceItem: any, serviceType: any): number {
        const simpleComm = this.calculateSimple(setting, serviceItem);
        const weightedComm = this.calculateWeighted(setting, serviceType);
        return simpleComm + weightedComm; // Assuming MIX is an addition of both, or it could be whatever the specific business rule entails.
    }
}
