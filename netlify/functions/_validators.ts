import type { Car, PriceRule } from '../../src/shared/types';

type CarPayload = Omit<Car, 'id' | 'created_at'> & { id?: string };
type PriceRulePayload = Omit<PriceRule, 'id' | 'created_at'> & { id?: string };

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const parseCarPayload = (body: unknown): CarPayload => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload');
  }
  const {
    id,
    name,
    category = 'sedan',
    base_price,
    per_km = 0,
    image_url = null,
    active = true,
  } = body as Partial<CarPayload>;

  if (id && typeof id !== 'string') {
    throw new Error('Invalid id');
  }
  if (!name || typeof name !== 'string') {
    throw new Error('Name is required');
  }
  if (
    category !== 'sedan' &&
    category !== 'suv' &&
    category !== 'luxury' &&
    category !== 'vintage' &&
    category !== 'other'
  ) {
    throw new Error('Invalid category');
  }
  const basePriceNum = typeof base_price === 'string' ? Number(base_price) : base_price;
  const perKmNum = typeof per_km === 'string' ? Number(per_km) : per_km;

  if (!isFiniteNumber(basePriceNum) || basePriceNum < 0) {
    throw new Error('base_price must be a non-negative number');
  }
  if (perKmNum !== undefined && (!isFiniteNumber(perKmNum) || perKmNum < 0)) {
    throw new Error('per_km must be a non-negative number');
  }
  if (image_url && typeof image_url !== 'string') {
    throw new Error('image_url must be a string');
  }

  return {
    id,
    name: name.trim(),
    category,
    base_price: Math.round(basePriceNum),
    per_km: perKmNum !== undefined ? Math.round(perKmNum) : 0,
    image_url: image_url ?? null,
    active: Boolean(active),
  };
};

export const parsePriceRulePayload = (body: unknown): PriceRulePayload => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload');
  }
  const {
    id,
    rule_name,
    type,
    scope,
    value,
    active = true,
  } = body as Partial<PriceRulePayload>;

  if (id && typeof id !== 'string') {
    throw new Error('Invalid id');
  }
  if (!rule_name || typeof rule_name !== 'string') {
    throw new Error('rule_name is required');
  }
  if (type !== 'discount' && type !== 'surcharge' && type !== 'multiplier') {
    throw new Error('Invalid type');
  }
  if (
    scope !== 'srinagar' &&
    scope !== 'outside_srinagar' &&
    scope !== 'weekend' &&
    scope !== 'custom'
  ) {
    throw new Error('Invalid scope');
  }
  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (!isFiniteNumber(numericValue)) {
    throw new Error('value must be a number');
  }
  if (type === 'multiplier' && numericValue <= 0) {
    throw new Error('Multiplier must be greater than zero');
  }

  return {
    id,
    rule_name: rule_name.trim(),
    type,
    scope,
    value: numericValue,
    active: Boolean(active),
  };
};
