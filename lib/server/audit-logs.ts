import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { withDb } from '@/lib/server/db'
import { ensureEventV4Schema } from '@/lib/server/events'
import { ensureRbacSchema } from '@/lib/server/rbac'

export type AuditLogSource = 'login' | 'admin_activity' | 'payment'

export type UnifiedAuditLog = {
  id: string
  source: AuditLogSource
  action: string
  actorName: string | null
  actorEmail: string | null
  entityType: string | null
  entityId: string | null
  success: boolean | null
  metadata: unknown
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export type AuditLogFilters = {
  source?: string
  action?: string
  actor?: string
  entityType?: string
  entityId?: string
  dateStart?: string
  dateEnd?: string
  q?: string
  limit?: number
  cursor?: string
}

type LoginAuditRow = RowDataPacket & {
  id: string
  user_id: string | null
  actor_name: string | null
  email: string
  role_code: string | null
  success: 0 | 1
  failure_reason: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: Date | string
}

type ActivityAuditRow = RowDataPacket & {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: unknown
  ip_address: string | null
  user_agent: string | null
  actor_name: string | null
  actor_email: string | null
  created_at: Date | string
}

type PaymentAuditRow = RowDataPacket & {
  id: string
  payment_id: string
  action: string
  metadata: unknown
  event_id: string | null
  event_title: string | null
  participant_id: string | null
  participant_name: string | null
  created_at: Date | string
}

const SECRET_KEY_PATTERN = /(secret|token|password|api[_-]?key|credential|signature|authorization)/i
const DEFAULT_LIMIT = 80
const MAX_LIMIT = 200

function toIso(value: Date | string | null | undefined) {
  if (!value) return new Date(0).toISOString()
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function parseJsonColumn(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeMetadata)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SECRET_KEY_PATTERN.test(key) ? '[redacted]' : sanitizeMetadata(item),
    ]),
  )
}

function metadataRecord(value: unknown): Record<string, unknown> {
  const parsed = parseJsonColumn(value)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
  return parsed as Record<string, unknown>
}

function normalizeLimit(limit?: number) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.floor(limit || DEFAULT_LIMIT), 1), MAX_LIMIT)
}

function cleanString(value?: string) {
  const text = value?.trim()
  return text || undefined
}

function likeValue(value: string) {
  return `%${value.replace(/[%_]/g, '\\$&')}%`
}

function addDateFilters(clauses: string[], params: Record<string, unknown>, column: string, filters: AuditLogFilters) {
  if (cleanString(filters.dateStart)) {
    clauses.push(`DATE(${column}) >= :dateStart`)
    params.dateStart = filters.dateStart
  }
  if (cleanString(filters.dateEnd)) {
    clauses.push(`DATE(${column}) <= :dateEnd`)
    params.dateEnd = filters.dateEnd
  }
  if (cleanString(filters.cursor)) {
    clauses.push(`${column} < :cursor`)
    params.cursor = filters.cursor
  }
}

function shouldLoadSource(source: AuditLogFilters['source'], target: AuditLogSource) {
  return !source || source === 'all' || source === target
}

async function listLoginLogs(connection: PoolConnection, filters: AuditLogFilters, limit: number) {
  if (!shouldLoadSource(filters.source, 'login')) return []
  const clauses: string[] = ['1 = 1']
  const params: Record<string, unknown> = { limit: limit * 2 }
  addDateFilters(clauses, params, 'alh.created_at', filters)

  const action = cleanString(filters.action)
  if (action) {
    clauses.push("(:action IN (alh.role_code, alh.failure_reason) OR :action = CASE WHEN alh.success = 1 THEN 'login.success' ELSE 'login.failed' END)")
    params.action = action
  }

  const actor = cleanString(filters.actor)
  if (actor) {
    clauses.push('(alh.email LIKE :actor OR u.full_name LIKE :actor)')
    params.actor = likeValue(actor)
  }

  const q = cleanString(filters.q)
  if (q) {
    clauses.push('(alh.email LIKE :q OR u.full_name LIKE :q OR alh.role_code LIKE :q OR alh.failure_reason LIKE :q OR alh.ip_address LIKE :q)')
    params.q = likeValue(q)
  }

  const [rows] = await connection.query<LoginAuditRow[]>(
    `
      SELECT alh.*, u.full_name AS actor_name
      FROM admin_login_history alh
      LEFT JOIN users u ON u.id = alh.user_id
      WHERE ${clauses.join(' AND ')}
      ORDER BY alh.created_at DESC
      LIMIT :limit
    `,
    params as never,
  )

  return rows.map((row): UnifiedAuditLog => ({
    id: row.id,
    source: 'login',
    action: row.success ? 'login.success' : 'login.failed',
    actorName: row.actor_name,
    actorEmail: row.email,
    entityType: 'admin_session',
    entityId: row.user_id,
    success: Boolean(row.success),
    metadata: sanitizeMetadata({
      roleCode: row.role_code,
      failureReason: row.failure_reason,
    }),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: toIso(row.created_at),
  }))
}

async function listActivityLogs(connection: PoolConnection, filters: AuditLogFilters, limit: number) {
  if (!shouldLoadSource(filters.source, 'admin_activity')) return []
  const clauses: string[] = ['1 = 1']
  const params: Record<string, unknown> = { limit: limit * 2 }
  addDateFilters(clauses, params, 'aal.created_at', filters)

  const action = cleanString(filters.action)
  if (action) {
    clauses.push('aal.action = :action')
    params.action = action
  }

  const entityType = cleanString(filters.entityType)
  if (entityType) {
    clauses.push('aal.entity_type = :entityType')
    params.entityType = entityType
  }

  const entityId = cleanString(filters.entityId)
  if (entityId) {
    clauses.push('aal.entity_id = :entityId')
    params.entityId = entityId
  }

  const actor = cleanString(filters.actor)
  if (actor) {
    clauses.push('(u.email LIKE :actor OR u.full_name LIKE :actor)')
    params.actor = likeValue(actor)
  }

  const q = cleanString(filters.q)
  if (q) {
    clauses.push('(aal.action LIKE :q OR aal.entity_type LIKE :q OR aal.entity_id LIKE :q OR u.email LIKE :q OR u.full_name LIKE :q)')
    params.q = likeValue(q)
  }

  const [rows] = await connection.query<ActivityAuditRow[]>(
    `
      SELECT
        aal.*,
        u.full_name AS actor_name,
        u.email AS actor_email
      FROM admin_activity_logs aal
      LEFT JOIN users u ON u.id = aal.user_id
      WHERE ${clauses.join(' AND ')}
      ORDER BY aal.created_at DESC
      LIMIT :limit
    `,
    params as never,
  )

  return rows.map((row): UnifiedAuditLog => ({
    id: row.id,
    source: 'admin_activity',
    action: row.action,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    entityType: row.entity_type,
    entityId: row.entity_id,
    success: null,
    metadata: sanitizeMetadata(parseJsonColumn(row.metadata)),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: toIso(row.created_at),
  }))
}

async function listPaymentLogs(connection: PoolConnection, filters: AuditLogFilters, limit: number) {
  if (!shouldLoadSource(filters.source, 'payment')) return []
  const clauses: string[] = ['1 = 1']
  const params: Record<string, unknown> = { limit: limit * 2 }
  addDateFilters(clauses, params, 'pal.created_at', filters)

  const action = cleanString(filters.action)
  if (action) {
    clauses.push('pal.action = :action')
    params.action = action
  }

  const entityType = cleanString(filters.entityType)
  if (entityType && entityType !== 'payment') return []

  const entityId = cleanString(filters.entityId)
  if (entityId) {
    clauses.push('pal.payment_id = :entityId')
    params.entityId = entityId
  }

  const q = cleanString(filters.q)
  if (q) {
    clauses.push('(pal.action LIKE :q OR pal.payment_id LIKE :q OR e.title LIKE :q OR p.full_name LIKE :q)')
    params.q = likeValue(q)
  }

  const [rows] = await connection.query<PaymentAuditRow[]>(
    `
      SELECT
        pal.*,
        pc.source_id AS participant_id,
        p.full_name AS participant_name,
        e.id AS event_id,
        e.title AS event_title
      FROM mpj_payment_core_audit_logs pal
      LEFT JOIN mpj_payment_core_payments pc ON pc.id = pal.payment_id
      LEFT JOIN mpj_event_participants p ON p.id = pc.source_id
      LEFT JOIN mpj_event_events e ON e.id = p.event_id
      WHERE ${clauses.join(' AND ')}
      ORDER BY pal.created_at DESC
      LIMIT :limit
    `,
    params as never,
  )

  return rows.map((row): UnifiedAuditLog => ({
    id: row.id,
    source: 'payment',
    action: row.action,
    actorName: null,
    actorEmail: null,
    entityType: 'payment',
    entityId: row.payment_id,
    success: null,
    metadata: sanitizeMetadata({
      ...metadataRecord(row.metadata),
      eventId: row.event_id,
      eventTitle: row.event_title,
      participantId: row.participant_id,
      participantName: row.participant_name,
    }),
    ipAddress: null,
    userAgent: null,
    createdAt: toIso(row.created_at),
  }))
}

function summarize(items: UnifiedAuditLog[]) {
  const since24h = Date.now() - 24 * 60 * 60 * 1000
  return {
    total: items.length,
    loginFailed: items.filter((item) => item.source === 'login' && item.success === false).length,
    paymentAudit: items.filter((item) => item.source === 'payment').length,
    adminActivity: items.filter((item) => item.source === 'admin_activity').length,
    last24h: items.filter((item) => new Date(item.createdAt).getTime() >= since24h).length,
  }
}

export async function listUnifiedAuditLogs(filters: AuditLogFilters = {}) {
  const limit = normalizeLimit(filters.limit)

  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      await ensureEventV4Schema(connection)

      const login = await listLoginLogs(connection, filters, limit)
      const activity = await listActivityLogs(connection, filters, limit)
      const payment = await listPaymentLogs(connection, filters, limit)

      const merged = [...login, ...activity, ...payment].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      const items = merged.slice(0, limit)
      const nextCursor = merged.length > limit ? items[items.length - 1]?.createdAt ?? null : null

      return {
        items,
        summary: summarize(merged),
        nextCursor,
      }
    } finally {
      connection.release()
    }
  })
}
