import type { AdminCar, AdminPriceRule, ApiError } from './types';
import { getToken } from './auth';

const API_BASE = '/api';

type ApiResponse<T> = T | ApiError;

type RequestInitExtended = RequestInit & { skipAuth?: boolean };

const request = async <T>(path: string, init: RequestInitExtended = {}): Promise<T> => {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (!init.skipAuth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = (await response.json()) as ApiResponse<never>;
      if (data && typeof data === 'object' && 'error' in data) {
        message = data.error;
      }
    } catch (error) {
      // ignore json parse errors
    }
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const getCars = async (): Promise<AdminCar[]> => {
  const data = await request<{ cars: AdminCar[] }>('/cars', { method: 'GET', skipAuth: true });
  return data.cars;
};

export const saveCar = async (car: Partial<AdminCar>): Promise<AdminCar> => {
  const method = car.id ? 'PUT' : 'POST';
  const data = await request<{ car: AdminCar }>('/cars-admin', {
    method,
    body: JSON.stringify(car),
  });
  return data.car;
};

export const deleteCar = async (id: string): Promise<void> => {
  await request('/cars-admin', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
};

export const getRules = async (): Promise<AdminPriceRule[]> => {
  const data = await request<{ rules: AdminPriceRule[] }>('/price-rules', { method: 'GET', skipAuth: true });
  return data.rules;
};

export const saveRule = async (rule: Partial<AdminPriceRule>): Promise<AdminPriceRule> => {
  const method = rule.id ? 'PUT' : 'POST';
  const data = await request<{ rule: AdminPriceRule }>('/price-rules-admin', {
    method,
    body: JSON.stringify(rule),
  });
  return data.rule;
};

export const deleteRule = async (id: string): Promise<void> => {
  await request('/price-rules-admin', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
};
