import { Pool } from 'pg';

/**
 * Read env at first use (not at module load) so Vercel/runtime sees DATABASE_URL.
 * Bracket access avoids some bundlers inlining undefined at build time.
 * Prefer pooled Neon URL for serverless.
 */
function getConnectionString(): string {
  const url =
    process.env['DATABASE_URL'] ??
    process.env['POSTGRES_URL'] ??
    process.env['POSTGRES_PRISMA_URL'];
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error(
      'Missing DATABASE_URL (or POSTGRES_URL). Set it in Vercel → Environment Variables for Production, then redeploy.'
    );
  }
  return url.trim();
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
