import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
const IDENTITY_JWKS_URL = process.env.IDENTITY_JWKS_URL;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const getAuthorizationHeader = (
  headers: Headers | Record<string, string | undefined>,
): string | null => {
  if (headers instanceof Headers) {
    return headers.get('authorization') || headers.get('Authorization');
  }
  return headers['authorization'] ?? headers['Authorization'] ?? null;
};

const getJwks = () => {
  if (!IDENTITY_JWKS_URL) {
    throw new Error('IDENTITY_JWKS_URL is not configured');
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(IDENTITY_JWKS_URL));
  }
  return jwks;
};

export type AuthContext = {
  sub: string;
  email?: string;
};

export const verifyRequest = async (
  headers: Headers | Record<string, string | undefined>,
): Promise<boolean | AuthContext> => {
  const authHeader = getAuthorizationHeader(headers);
  if (!authHeader) {
    return false;
  }

  const [scheme, tokenValue] = authHeader.split(' ');
  const token = tokenValue?.trim();
  if (!token || scheme?.toLowerCase() !== 'bearer') {
    return false;
  }

  if (ADMIN_API_TOKEN && token === ADMIN_API_TOKEN) {
    return { sub: 'admin-token' };
  }

  if (!IDENTITY_JWKS_URL) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: 'https://identity.netlify.com/',
      audience: undefined,
    });
    return normalizePayload(payload);
  } catch (error) {
    console.error('Auth verification failed', error);
    return false;
  }
};

const normalizePayload = (payload: JWTPayload): AuthContext => ({
  sub: typeof payload.sub === 'string' ? payload.sub : 'unknown',
  email: typeof payload.email === 'string' ? payload.email : undefined,
});
