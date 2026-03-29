import { Pool, type PoolConfig } from 'pg';
import pgConnectionString from 'pg-connection-string';

/**
 * Vercel often sets PGHOST, PGDATABASE, PGUSER, etc. The `pg` client merges those with
 * parsed URLs; a bad PG* value can override the URL and connect to the wrong database
 * (empty DB → "relation does not exist" for every table). We parse the URL and build
 * an explicit PoolConfig so only the URL you intend is used.
 */
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

function createPool(): Pool {
  const raw = pickDatabaseUrl();
  const parsed = pgConnectionString.parse(raw, { useLibpqCompat: true });
  if (!parsed.host) {
    throw new Error('Invalid DATABASE_URL: missing host');
  }
  const clientConfig = pgConnectionString.toClientConfig(parsed) as PoolConfig;
  // Neon pooler (PgBouncer) rejects startup `options` (e.g. search_path). Do not set Pool `options`.
  // https://neon.tech/docs/connect/connection-errors#unsupported-startup-parameter
  const { options: _discardOptions, ...restClientConfig } = clientConfig;

  const database =
    (typeof clientConfig.database === 'string' && clientConfig.database.trim() !== ''
      ? clientConfig.database
      : parsed.database) || 'neondb';

  void _discardOptions;

  return new Pool({
    ...restClientConfig,
    host: clientConfig.host ?? parsed.host ?? undefined,
    user: clientConfig.user ?? parsed.user ?? undefined,
    password: clientConfig.password ?? parsed.password,
    database,
    ssl: clientConfig.ssl ?? { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 15000,
    application_name: 'custom-sports-bets',
  });
}

let _pool: Pool | undefined;

function getPool(): Pool {
  if (!_pool) {
    _pool = createPool();
    _pool.on('connect', () => {
      console.log('Connected to Neon database');
    });
    _pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return _pool;
}

/**
 * Only `query` is used across the app — explicit delegate avoids Proxy edge cases with `pg`.
 */
const pool = {
  query: ((...args: Parameters<Pool['query']>) =>
    getPool().query(...args)) as Pool['query'],
} as Pool;

export default pool;
