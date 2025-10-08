import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
const JWKS_URL = process.env.IDENTITY_JWKS_URL;
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export type Identity = { sub: string; email?: string };

function getAuthorizationHeader(headers: Record<string, string | undefined> | Headers): string | null {
  if (headers instanceof Headers) {
    return headers.get('authorization') || headers.get('Authorization');
  }
  return headers['authorization'] ?? headers['Authorization'] ?? null;
}

export async function verifyRequest(
  headers: Record<string, string | undefined> | Headers,
): Promise<boolean | Identity> {
  const authHeader = getAuthorizationHeader(headers);
  if (!authHeader) {
    return false;
  }

  const [scheme, token] = authHeader.split(' ');
  if (!token || scheme?.toLowerCase() !== 'bearer') {
    return false;
  }

  if (ADMIN_TOKEN && token === ADMIN_TOKEN) {
    return true;
  }

  if (!JWKS_URL) {
    return false;
  }

  try {
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(JWKS_URL));
    }
    const { payload } = await jwtVerify(token, jwks);
    return normalizePayload(payload);
  } catch (error) {
    console.error('JWT verification failed', error);
    return false;
  }
}

function normalizePayload(payload: JWTPayload): Identity {
  return {
    sub: typeof payload.sub === 'string' ? payload.sub : 'unknown',
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}
