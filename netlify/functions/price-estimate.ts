import type { Handler } from '@netlify/functions';
import { getServiceSupabase } from './_supabase';
import { applyPriceRules } from '../../src/shared/price';
import type { Car, PriceEstimateInput, PriceRule } from '../../src/shared/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const parseBody = (body: string | null): PriceEstimateInput => {
  if (!body) {
    throw new Error('Missing request body');
  }
  const parsed = JSON.parse(body) as Partial<PriceEstimateInput>;
  if (!parsed.carId || typeof parsed.carId !== 'string') {
    throw new Error('carId is required');
  }
  const kms = parsed.kms !== undefined ? Number(parsed.kms) : 0;
  if (Number.isNaN(kms) || kms < 0) {
    throw new Error('kms must be a non-negative number');
  }
  const scope = parsed.scope === 'outside_srinagar' ? 'outside_srinagar' : 'srinagar';
  const date = parsed.dateISO ? new Date(parsed.dateISO) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid dateISO');
  }
  return {
    carId: parsed.carId,
    kms,
    scope,
    dateISO: date.toISOString(),
  };
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const input = parseBody(event.body ?? null);
    const supabase = getServiceSupabase();

    const { data: car, error: carError } = await supabase
      .from<Car>('cars')
      .select('*')
      .eq('id', input.carId)
      .maybeSingle();

    if (carError) {
      throw carError;
    }

    if (!car || !car.active) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Car not found' }),
      };
    }

    const { data: rules, error: ruleError } = await supabase
      .from<PriceRule>('price_rules')
      .select('*')
      .eq('active', true);

    if (ruleError) {
      throw ruleError;
    }

    const date = new Date(input.dateISO ?? new Date().toISOString());
    const estimateResult = applyPriceRules({
      base: car.base_price,
      perKm: car.per_km,
      kms: input.kms ?? 0,
      rules: rules ?? [],
      date,
      scope: input.scope,
    });

    const { appliedRules: _applied, ...estimate } = estimateResult;

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        estimate,
        car: {
          id: car.id,
          name: car.name,
          category: car.category,
          base_price: car.base_price,
          per_km: car.per_km,
          image_url: car.image_url,
        },
      }),
    };
  } catch (error) {
    console.error('price-estimate error', error);
    const message = error instanceof Error ? error.message : 'Unable to calculate price';
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: message }),
    };
  }
};
