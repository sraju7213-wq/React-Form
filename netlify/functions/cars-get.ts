import type { Handler } from '@netlify/functions';
import { getServiceSupabase } from './_supabase';
import type { Car } from '../../src/shared/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from<Car>('cars')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cars: data ?? [] }),
    };
  } catch (error) {
    console.error('cars-get error', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch cars' }),
    };
  }
};
