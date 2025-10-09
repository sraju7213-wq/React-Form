const STORAGE_KEY = 'valley-admin-token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to read token', error);
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (!token) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, token);
    }
  } catch (error) {
    console.warn('Unable to persist token', error);
  }
};
