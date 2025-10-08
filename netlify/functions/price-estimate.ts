import type { Handler } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { applyPriceRules } from '../../src/shared/price';
import type { PriceEstimateInput, PriceRule } from '../../src/shared/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

class ValidationError extends Error {}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const input = parseEstimateInput(event.body);
    const supabase = getSupabaseClient();

    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('*')
      .eq('id', input.carId)
      .maybeSingle();
    if (carError) throw carError;
    if (!car || car.active === false) {
      throw new ValidationError('Car not found');
    }

    const scopes = ['weekend', input.scope];
    const { data: rules, error: rulesError } = await supabase
      .from('price_rules')
      .select('*')
      .eq('active', true)
      .in('scope', scopes);
    if (rulesError) throw rulesError;

    const date = input.dateISO ? new Date(input.dateISO) : new Date();

    const result = applyPriceRules({
      base: car.base_price,
      perKm: car.per_km ?? 0,
      kms: input.kms ?? 0,
      rules: (rules ?? []) as PriceRule[],
      date,
      scope: input.scope,
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('price-estimate error', error);
    const status = error instanceof ValidationError ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return {
      statusCode: status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    };
  }
};

function parseEstimateInput(body: string | null): PriceEstimateInput {
  if (!body) {
    throw new ValidationError('Missing request body');
  }
  let payload: Partial<PriceEstimateInput>;
  try {
    payload = JSON.parse(body) as Partial<PriceEstimateInput>;
  } catch {
    throw new ValidationError('Invalid JSON payload');
  }
  if (!payload.carId) {
    throw new ValidationError('carId is required');
  }
  if (!payload.scope || !['srinagar', 'outside_srinagar'].includes(payload.scope)) {
    throw new ValidationError('Invalid scope');
  }
  const kms = Number(payload.kms ?? 0);
  if (!Number.isFinite(kms) || kms < 0) {
    throw new ValidationError('Invalid kms');
  }
  return {
    carId: payload.carId,
    scope: payload.scope,
    kms,
    dateISO: payload.dateISO ?? undefined,
  };
}
