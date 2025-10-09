import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
const IDENTITY_JWKS_URL = process.env.IDENTITY_JWKS_URL;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

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
  headers: Headers,
): Promise<boolean | AuthContext> => {
  const authHeader = headers.get('authorization') || headers.get('Authorization');
  if (!authHeader) {
    return false;
  }
  const token = authHeader.replace(/^[Bb]earer\s+/u, '').trim();

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
  sub: payload.sub ?? 'unknown',
  email: typeof payload.email === 'string' ? payload.email : undefined,
});
