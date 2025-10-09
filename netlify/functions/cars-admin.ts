import type { Handler } from '@netlify/functions';
import { verifyRequest } from './_auth';
import { getServiceSupabase } from './_supabase';
import { parseCarPayload } from './_validators';
import type { Car } from '../../src/shared/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

const unauthorizedResponse = {
  statusCode: 401,
  headers: corsHeaders,
  body: JSON.stringify({ error: 'Unauthorized' }),
};

const methodNotAllowed = {
  statusCode: 405,
  headers: corsHeaders,
  body: JSON.stringify({ error: 'Method Not Allowed' }),
};

const handleError = (error: unknown) => {
  console.error('cars-admin error', error);
  return {
    statusCode: 500,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Internal Server Error' }),
  };
};

export const handler: Handler = async (event) => {
  const start = Date.now();
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  const auth = await verifyRequest(new Headers(event.headers as Record<string, string>));
  if (!auth) {
    return unauthorizedResponse;
  }

  try {
    const supabase = getServiceSupabase();
    const body = event.body ? JSON.parse(event.body) : {};

    switch (event.httpMethod) {
      case 'POST': {
        const { id, ...payload } = parseCarPayload(body);
        const { data, error } = await supabase
          .from<Car>('cars')
          .insert(payload)
          .select()
          .single();
        if (error) {
          throw error;
        }
        return {
          statusCode: 201,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ car: data }),
        };
      }
      case 'PUT': {
        const payload = parseCarPayload(body);
        if (!payload.id) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'id is required for update' }),
          };
        }
        const { id, ...update } = payload;
        const { data, error } = await supabase
          .from<Car>('cars')
          .update(update)
          .eq('id', id)
          .select()
          .single();
        if (error) {
          throw error;
        }
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ car: data }),
        };
      }
      case 'DELETE': {
        const { id } = body as { id?: string };
        if (!id || typeof id !== 'string') {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'id is required for delete' }),
          };
        }
        const { error } = await supabase
          .from<Car>('cars')
          .update({ active: false })
          .eq('id', id);
        if (error) {
          throw error;
        }
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ success: true }),
        };
      }
      default:
        return methodNotAllowed;
    }
  } catch (error) {
    return handleError(error);
  } finally {
    const latency = Date.now() - start;
    console.log(`cars-admin ${event.httpMethod} - ${latency}ms`);
  }
};
