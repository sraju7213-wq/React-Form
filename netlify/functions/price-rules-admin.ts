import type { Handler } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { verifyRequest } from './_auth';
import type { PriceRule } from '../../src/shared/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

type RulePayload = Partial<PriceRule> & { id?: string };

class ValidationError extends Error {}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  const authResult = await verifyRequest(event.headers);
  if (!authResult) {
    return {
      statusCode: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Unauthorized' }),
    };
  }

  const supabase = getSupabaseClient();

  try {
    switch (event.httpMethod) {
      case 'POST': {
        const payload = parseRulePayload(event.body);
        const { data, error } = await supabase.from('price_rules').insert(payload).select().single();
        if (error) throw error;
        return respond(200, data);
      }
      case 'PUT': {
        const payload = parseRulePayload(event.body, true);
        const { data, error } = await supabase.from('price_rules').update(payload).eq('id', payload.id).select().single();
        if (error) throw error;
        return respond(200, data);
      }
      case 'DELETE': {
        const { id } = parseDeletePayload(event.body);
        const { error } = await supabase.from('price_rules').delete().eq('id', id);
        if (error) throw error;
        return respond(204);
      }
      default:
        return respond(405, { message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('price-rules-admin error', error);
    const status = error instanceof ValidationError ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return respond(status, { message });
  }
};

function parseRulePayload(body: string | null, requireId = false): RulePayload {
  if (!body) {
    throw new ValidationError('Missing request body');
  }
  let payload: RulePayload;
  try {
    payload = JSON.parse(body) as RulePayload;
  } catch {
    throw new ValidationError('Invalid JSON payload');
  }
  if (requireId && !payload.id) {
    throw new ValidationError('Rule id is required');
  }
  if (!payload.rule_name || typeof payload.rule_name !== 'string') {
    throw new ValidationError('Rule name is required');
  }
  if (!payload.type || !['discount', 'surcharge', 'multiplier'].includes(payload.type)) {
    throw new ValidationError('Invalid type');
  }
  if (!payload.scope || !['srinagar', 'outside_srinagar', 'weekend', 'custom'].includes(payload.scope)) {
    throw new ValidationError('Invalid scope');
  }
  const numericValue = Number(payload.value);
  if (Number.isNaN(numericValue)) {
    throw new ValidationError('Invalid value');
  }
  if (payload.type === 'multiplier' && numericValue <= 0) {
    throw new ValidationError('Multiplier must be greater than 0');
  }
  return {
    id: payload.id,
    rule_name: payload.rule_name.trim(),
    type: payload.type,
    scope: payload.scope,
    value: numericValue,
    active: payload.active ?? true,
  };
}

function parseDeletePayload(body: string | null): { id: string } {
  if (!body) {
    throw new ValidationError('Missing request body');
  }
  let payload: { id?: string };
  try {
    payload = JSON.parse(body) as { id?: string };
  } catch {
    throw new ValidationError('Invalid JSON payload');
  }
  if (!payload.id) {
    throw new ValidationError('Rule id is required');
  }
  return { id: payload.id };
}

function respond(statusCode: number, body?: unknown) {
  return {
    statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : '',
  };
}
