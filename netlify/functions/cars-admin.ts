import type { Handler } from '@netlify/functions';
import { getSupabaseClient } from './_supabase';
import { verifyRequest } from './_auth';
import type { Car } from '../../src/shared/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

type CarPayload = Partial<Car> & { id?: string };

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
        const payload = parseCarPayload(event.body);
        const { data, error } = await supabase.from('cars').insert(payload).select().single();
        if (error) throw error;
        return respond(200, data);
      }
      case 'PUT': {
        const payload = parseCarPayload(event.body, true);
        const { data, error } = await supabase.from('cars').update(payload).eq('id', payload.id).select().single();
        if (error) throw error;
        return respond(200, data);
      }
      case 'DELETE': {
        const { id } = parseDeletePayload(event.body);
        const { error } = await supabase.from('cars').delete().eq('id', id);
        if (error) throw error;
        return respond(204);
      }
      default:
        return respond(405, { message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('cars-admin error', error);
    const status = error instanceof ValidationError ? 400 : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return respond(status, { message });
  }
};

function parseCarPayload(body: string | null, requireId = false): CarPayload {
  if (!body) {
    throw new ValidationError('Missing request body');
  }
  let payload: CarPayload;
  try {
    payload = JSON.parse(body) as CarPayload;
  } catch {
    throw new ValidationError('Invalid JSON payload');
  }
  if (requireId && !payload.id) {
    throw new ValidationError('Car id is required');
  }
  if (!payload.name || typeof payload.name !== 'string') {
    throw new ValidationError('Car name is required');
  }
  if (!payload.category || !['sedan', 'suv', 'luxury', 'vintage', 'other'].includes(payload.category)) {
    throw new ValidationError('Invalid category');
  }
  if (payload.base_price === undefined || Number.isNaN(Number(payload.base_price)) || Number(payload.base_price) < 0) {
    throw new ValidationError('Invalid base_price');
  }
  if (payload.per_km === undefined || Number.isNaN(Number(payload.per_km)) || Number(payload.per_km) < 0) {
    throw new ValidationError('Invalid per_km');
  }
  return {
    id: payload.id,
    name: payload.name.trim(),
    category: payload.category,
    base_price: Math.round(Number(payload.base_price)),
    per_km: Math.round(Number(payload.per_km)),
    image_url: payload.image_url ? String(payload.image_url).trim() : null,
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
    throw new ValidationError('Car id is required');
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
