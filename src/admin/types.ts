import type { Car, PriceRule } from '../shared/types';

export type EditableCar = Omit<Car, 'created_at'>;
export type EditablePriceRule = Omit<PriceRule, 'created_at'>;

export type CarDraft = Partial<EditableCar> & { id?: string };
export type PriceRuleDraft = Partial<EditablePriceRule> & { id?: string };
