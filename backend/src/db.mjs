import mysql from "mysql2/promise"

let pool

export function getDbConfig() {
  const host = process.env.DB_HOST
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const database = process.env.DB_NAME
  const port = Number(process.env.DB_PORT || 3306)

  const missing = [
    ["DB_HOST", host],
    ["DB_USER", user],
    ["DB_PASSWORD", password],
    ["DB_NAME", database],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing database environment variables: ${missing.join(", ")}`)
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("DB_PORT must be a valid positive integer")
  }

  return { host, user, password, database, port }
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...getDbConfig(),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    })
  }

  return pool
}

export async function query(sql, params = {}) {
  const [rows] = await getPool().execute(sql, params)
  return rows
}

export async function testConnection() {
  const rows = await query("SELECT 1 AS ok")
  return rows[0]?.ok === 1
}
