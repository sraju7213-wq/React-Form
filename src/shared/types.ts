export type CarCategory = 'sedan' | 'suv' | 'luxury' | 'vintage' | 'other';
export type PriceScope = 'srinagar' | 'outside_srinagar' | 'weekend' | 'custom';
export type RuleType = 'discount' | 'surcharge' | 'multiplier';

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

export type PriceRuleType = RuleType;
export type PriceRuleScope = PriceScope;

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
  scope: Extract<PriceScope, 'srinagar' | 'outside_srinagar'>;
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
