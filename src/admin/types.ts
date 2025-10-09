import type { Car, PriceEstimate, PriceRule } from '@shared/types';

export type AdminCar = Car;
export type AdminPriceRule = PriceRule;
export type AdminPriceEstimate = PriceEstimate;

export type ApiError = {
  error: string;
};
