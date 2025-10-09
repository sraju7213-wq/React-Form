export type CarCategory = 'sedan' | 'suv' | 'luxury' | 'vintage' | 'other';

export type Car = {
  id: string;
  name: string;
  category: CarCategory;
  base_price: number;
  per_km: number;
  image_url?: string | null;
  active: boolean;
  created_at?: string;
};

export type PriceRuleType = 'discount' | 'surcharge' | 'multiplier';
export type PriceRuleScope = 'srinagar' | 'outside_srinagar' | 'weekend' | 'custom';

export type PriceRule = {
  id: string;
  rule_name: string;
  type: PriceRuleType;
  scope: PriceRuleScope;
  value: number;
  active: boolean;
  created_at?: string;
};

export type PriceEstimateInput = {
  carId: string;
  kms?: number;
  dateISO?: string;
  scope: Extract<PriceRuleScope, 'srinagar' | 'outside_srinagar'>;
};

export type PriceAdjustment = {
  ruleId: string;
  rule_name: string;
  delta: number;
};

export type PriceEstimate = {
  base: number;
  perKmComponent: number;
  adjustments: PriceAdjustment[];
  total: number;
};
