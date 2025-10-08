import type { PriceEstimate, PriceRule } from './types';

type ApplyPriceRulesArgs = {
  base: number;
  perKm: number;
  kms: number;
  rules: PriceRule[];
  date: Date;
  scope: 'srinagar' | 'outside_srinagar';
};

type PriceComputation = Pick<PriceEstimate, 'adjustments' | 'total' | 'perKmComponent'> & { base: number };

const WEEKEND_DAYS = new Set([0, 6]);

function isWeekend(date: Date): boolean {
  return WEEKEND_DAYS.has(date.getUTCDay());
}

export function applyPriceRules({
  base,
  perKm,
  kms,
  rules,
  date,
  scope,
}: ApplyPriceRulesArgs): PriceComputation {
  const activeRules = rules.filter((rule) => rule.active);
  const perKmComponent = Math.max(0, perKm) * Math.max(0, kms);
  let runningTotal = Math.max(0, base) + perKmComponent;
  const adjustments: PriceEstimate['adjustments'] = [];

  const weekend = isWeekend(date);

  for (const rule of activeRules) {
    if (rule.scope === 'custom') {
      continue;
    }

    if (rule.scope === 'weekend' && !weekend) {
      continue;
    }

    if (rule.scope !== 'weekend' && rule.scope !== scope) {
      continue;
    }

    switch (rule.type) {
      case 'discount': {
        const delta = runningTotal * rule.value;
        runningTotal += delta;
        adjustments.push({ ruleId: rule.id, rule_name: rule.rule_name, delta });
        break;
      }
      case 'surcharge': {
        const delta = runningTotal * rule.value;
        runningTotal += delta;
        adjustments.push({ ruleId: rule.id, rule_name: rule.rule_name, delta });
        break;
      }
      case 'multiplier': {
        const previous = runningTotal;
        runningTotal = runningTotal * rule.value;
        const delta = runningTotal - previous;
        adjustments.push({ ruleId: rule.id, rule_name: rule.rule_name, delta });
        break;
      }
      default:
        break;
    }
  }

  const total = Math.max(0, Math.round(runningTotal));

  return {
    base: Math.max(0, base),
    perKmComponent,
    adjustments,
    total,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}
