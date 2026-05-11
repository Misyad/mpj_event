import { NextResponse } from 'next/server'
import { getDbConfig, withDb } from '@/lib/server/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = getDbConfig()

    await withDb(async (db) => {
      await db.query('SELECT 1 AS ok')
    })

    return NextResponse.json({
      ok: true,
      database: {
        host: config.host,
        port: config.port,
        name: config.database,
        user: config.user,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 500 },
    )
  }
}
