import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Debug: confirms what Postgres this deployment uses (same code path as real API).
 * Set HEALTH_CHECK_SECRET in Vercel, then GET:
 *   /api/health/db?secret=YOUR_SECRET
 * Remove or leave unset in production once done debugging.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.HEALTH_CHECK_SECRET;
  const secret = request.nextUrl.searchParams.get('secret');

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const envHint = {
      hasDATABASE_URL: Boolean(process.env['DATABASE_URL']),
      hasPOSTGRES_URL: Boolean(process.env['POSTGRES_URL']),
    };

    const info = await pool.query<{
      db: string;
      search_path: string;
      teams: string | null;
    }>(`
      SELECT
        current_database() AS db,
        current_setting('search_path') AS search_path,
        to_regclass('public.teams')::text AS teams
    `);

    return NextResponse.json({
      ok: true,
      env: envHint,
      postgres: info.rows[0],
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      {
        ok: false,
        message: err.message,
        code: (e as { code?: string }).code,
      },
      { status: 500 }
    );
  }
}
