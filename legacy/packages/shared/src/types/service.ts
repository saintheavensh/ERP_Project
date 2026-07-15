export interface ServiceType {
  id: string;
  name: string;
  category: 'BERAT' | 'SEDANG' | 'RINGAN';
  weight: number;
  commissionPercent: number;
}

export interface RoleBehavior {
  mode: 'strict' | 'flexible';
}

export interface TechnicianCommissionConfig {
  commissionType: 'SIMPLE' | 'WEIGHTED' | 'MIX' | 'SALARY';
  simpleRate?: number;
  baseSalary?: number;
  valuePerPoint?: number;
}
