import { Pool } from 'pg';

/**
 * Read env at first use (not at module load) so Vercel/runtime sees DATABASE_URL.
 * Bracket access avoids some bundlers inlining undefined at build time.
 * Prefer pooled Neon URL for serverless.
 */
function getConnectionString(): string {
  const url = pickDatabaseUrl();
  return normalizeConnectionString(url);
}

/** First non-empty wins. `??` alone is wrong here: `"" ?? postgresql://...` keeps "". */
function pickDatabaseUrl(): string {
  const keys = ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL'] as const;
  for (const key of keys) {
    const v = process.env[key];
    if (typeof v === 'string' && v.trim() !== '') {
      return v.trim();
    }
  }
  throw new Error(
    'Missing DATABASE_URL (or POSTGRES_URL). Set it in Vercel → Environment Variables for Production, then redeploy.'
  );
}

/**
 * pg v8 warns when sslmode=require is parsed as verify-full; pg v9 will match libpq.
 * Opt into libpq-compatible SSL for connection-string parsing (see pg-connection-string).
 */
function normalizeConnectionString(url: string): string {
  let out = url;

  if (!/\buselibpqcompat=/.test(out) && /\bsslmode=(require|prefer|verify-ca)\b/.test(out)) {
    const sep = out.includes('?') ? '&' : '?';
    out = `${out}${sep}uselibpqcompat=true`;
  }

  // Unqualified names (users, teams) must hit public.* — Neon default search_path can omit public.
  if (!/[?&]options=/.test(out) && !/search_path%3Dpublic/.test(out)) {
    const sep = out.includes('?') ? '&' : '?';
    out = `${out}${sep}options=-c%20search_path%3Dpublic`;
  }

  return out;
}

let _pool: Pool | undefined;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: getConnectionString(),
      // Serverless: keep pool small; Neon pooler handles multiplexing
      max: 5,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 15000,
      ssl: { rejectUnauthorized: false },
    });
    _pool.on('connect', () => {
      console.log('Connected to Neon database');
    });
    _pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return _pool;
}

/** Lazy Pool — first query reads env at runtime (important on Vercel). */
const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const real = getPool();
    const value = (real as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...a: unknown[]) => unknown).bind(real);
    }
    return value;
  },
});

export default pool;
