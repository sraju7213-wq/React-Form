import type { PriceEstimate, PriceRule, PriceRuleScope } from './types';

type ApplyPriceRulesArgs = {
  base: number;
  perKm: number;
  kms: number;
  rules: PriceRule[];
  date: Date;
  scope: PriceRuleScope;
};

type ApplyPriceRulesResult = PriceEstimate & {
  appliedRules: PriceRule[];
};

const WEEKEND_DAYS = new Set([0, 6]);

const isWeekend = (date: Date): boolean => WEEKEND_DAYS.has(date.getUTCDay());

const scopeMatches = (ruleScope: PriceRuleScope, scope: PriceRuleScope, weekend: boolean): boolean => {
  if (ruleScope === 'custom') {
    return true;
  }
  if (ruleScope === 'weekend') {
    return weekend;
  }
  return ruleScope === scope;
};

export const applyPriceRules = ({
  base,
  perKm,
  kms,
  rules,
  date,
  scope,
}: ApplyPriceRulesArgs): ApplyPriceRulesResult => {
  const baseComponent = Math.max(base, 0);
  const perKmComponent = Math.max(perKm, 0) * Math.max(kms, 0);
  let runningTotal = baseComponent + perKmComponent;
  const weekend = isWeekend(date);
  const adjustments: PriceEstimate['adjustments'] = [];
  const appliedRules: PriceRule[] = [];

  for (const rule of rules) {
    if (!rule.active) {
      continue;
    }

    if (!scopeMatches(rule.scope, scope, weekend)) {
      continue;
    }

    const initialTotal = runningTotal;
    let delta = 0;

    switch (rule.type) {
      case 'discount':
      case 'surcharge': {
        delta = initialTotal * Number(rule.value);
        runningTotal += delta;
        break;
      }
      case 'multiplier': {
        const multiplier = Number(rule.value);
        if (multiplier <= 0) {
          continue;
        }
        runningTotal = initialTotal * multiplier;
        delta = runningTotal - initialTotal;
        break;
      }
      default:
        continue;
    }

    adjustments.push({
      ruleId: rule.id,
      rule_name: rule.rule_name,
      delta,
    });
    appliedRules.push(rule);
  }

  return {
    base: baseComponent,
    perKmComponent,
    adjustments,
    total: Math.max(Math.round(runningTotal), 0),
    appliedRules,
  };
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
