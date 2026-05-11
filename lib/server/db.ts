import mysql, { type Pool } from 'mysql2/promise'

export type DbConfig = {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export function getDbConfig(): DbConfig {
  const host = process.env.DB_HOST
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const database = process.env.DB_NAME
  const port = Number(process.env.DB_PORT ?? 3306)

  const missing = [
    ['DB_HOST', host],
    ['DB_USER', user],
    ['DB_PASSWORD', password],
    ['DB_NAME', database],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing database environment variables: ${missing.join(', ')}`)
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('DB_PORT must be a valid positive integer')
  }

  return {
    host: host as string,
    port,
    user: user as string,
    password: password as string,
    database: database as string,
  }
}

export async function withDb<T>(callback: (db: Pool) => Promise<T>): Promise<T> {
  const pool = mysql.createPool({
    ...getDbConfig(),
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  })

  try {
    return await callback(pool)
  } finally {
    await pool.end()
  }
}
