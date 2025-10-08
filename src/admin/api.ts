import type { Car, PriceRule } from '../shared/types';
import type { CarDraft, PriceRuleDraft } from './types';

const API_BASE = '/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload && typeof payload.message === 'string') {
      return payload.message;
    }
  } catch (error) {
    console.error('Failed to parse error payload', error);
  }
  return `Request failed (${response.status})`;
}

export function getCars(): Promise<Car[]> {
  return request<Car[]>('/cars');
}

export function getPriceRules(): Promise<PriceRule[]> {
  return request<PriceRule[]>('/price-rules');
}

export function saveCar(token: string, car: CarDraft): Promise<Car> {
  if (!token) {
    return Promise.reject(new Error('Admin token required'));
  }
  const payload = normalizeCar(car);
  const method = car.id ? 'PUT' : 'POST';
  return request<Car>('/cars-admin', { method, body: payload, token });
}

export function deleteCar(token: string, id: string): Promise<void> {
  if (!token) {
    return Promise.reject(new Error('Admin token required'));
  }
  return request<void>('/cars-admin', { method: 'DELETE', body: { id }, token });
}

export function savePriceRule(token: string, rule: PriceRuleDraft): Promise<PriceRule> {
  if (!token) {
    return Promise.reject(new Error('Admin token required'));
  }
  const payload = normalizeRule(rule);
  const method = rule.id ? 'PUT' : 'POST';
  return request<PriceRule>('/price-rules-admin', { method, body: payload, token });
}

export function deletePriceRule(token: string, id: string): Promise<void> {
  if (!token) {
    return Promise.reject(new Error('Admin token required'));
  }
  return request<void>('/price-rules-admin', { method: 'DELETE', body: { id }, token });
}

function normalizeCar(car: CarDraft): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: car.name?.trim(),
    category: car.category ?? 'sedan',
    base_price: Number(car.base_price ?? 0),
    per_km: Number(car.per_km ?? 0),
    image_url: car.image_url?.trim() || null,
    active: car.active ?? true,
  };
  if (car.id) {
    payload.id = car.id;
  }
  return payload;
}

function normalizeRule(rule: PriceRuleDraft): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    rule_name: rule.rule_name?.trim(),
    type: rule.type ?? 'discount',
    scope: rule.scope ?? 'srinagar',
    value: Number(rule.value ?? 0),
    active: rule.active ?? true,
  };
  if (rule.id) {
    payload.id = rule.id;
  }
  return payload;
}
