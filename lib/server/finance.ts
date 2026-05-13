import { randomUUID } from 'crypto'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { AdminSession } from '@/lib/server/rbac'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { withDb } from '@/lib/server/db'
import { ensureEventV4Schema } from '@/lib/server/events'

export type FinanceTransactionType = 'income' | 'expense'
export type FinanceTransactionSource = 'payment' | 'manual' | 'sponsor' | 'subsidy' | 'adjustment'
export type FinanceTransactionStatus = 'posted' | 'void'

export type FinanceTransactionPayload = {
  type?: FinanceTransactionType
  categoryId?: string
  title?: string
  amount?: number
  description?: string | null
  transactionDate?: string | null
  proofUrl?: string | null
}

type EventScopeRow = RowDataPacket & {
  id: string
  title: string
  scope: 'pusat' | 'regional'
  region_id: string | null
}

type FinanceCategoryRow = RowDataPacket & {
  id: string
  name: string
  type: FinanceTransactionType
  scope: string
  is_active: 0 | 1
}

type FinanceTransactionRow = RowDataPacket & {
  id: string
  event_id: string
  event_title: string | null
  type: FinanceTransactionType
  source: FinanceTransactionSource
  category_id: string
  category_name: string | null
  payment_id: string | null
  participant_id: string | null
  amount: number
  title: string
  description: string | null
  transaction_date: Date | string
  proof_url: string | null
  status: FinanceTransactionStatus
  scope: 'pusat' | 'regional'
  region_id: string | null
  created_by: string | null
  updated_by: string | null
  created_at: Date | string
  updated_at: Date | string
}

type PaymentMonitorRow = RowDataPacket & {
  payment_id: string
  event_id: string
  event_title: string
  event_scope: 'pusat' | 'regional'
  event_region_id: string | null
  participant_id: string
  participant_name: string | null
  registration_path: 'NIAM' | 'UMUM'
  amount: number
  status: string
  payment_method: string
  payment_channel: string | null
  payment_date: Date | string | null
  created_at: Date | string
}

type EventRecapRow = RowDataPacket & {
  event_id: string
  event_title: string
  scope: 'pusat' | 'regional'
  region_id: string | null
  income_total: number | null
  expense_total: number | null
  transaction_count: number
}

const INCOME_CATEGORIES = ['HTM Peserta', 'Sponsor', 'Donasi', 'Subsidi', 'Lainnya']
const EXPENSE_CATEGORIES = ['Konsumsi', 'Tempat', 'Transport', 'Akomodasi', 'Publikasi', 'Perlengkapan', 'Honorarium', 'Operasional', 'Lainnya']

function toIso(value: Date | string | null) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  return [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
}

export async function ensureFinanceSchema(connection: PoolConnection) {
  await ensureEventV4Schema(connection)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS event_finance_categories (
      id VARCHAR(36) NOT NULL,
      name VARCHAR(120) NOT NULL,
      type VARCHAR(20) NOT NULL,
      scope VARCHAR(20) NOT NULL DEFAULT 'global',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY event_finance_category_unique (name, type, scope)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS event_finance_transactions (
      id VARCHAR(36) NOT NULL,
      event_id VARCHAR(36) NOT NULL,
      type VARCHAR(20) NOT NULL,
      source VARCHAR(30) NOT NULL DEFAULT 'manual',
      category_id VARCHAR(36) NOT NULL,
      payment_id VARCHAR(120) NULL,
      participant_id VARCHAR(36) NULL,
      amount INT UNSIGNED NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      proof_url VARCHAR(700) NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'posted',
      scope VARCHAR(20) NOT NULL DEFAULT 'pusat',
      region_id VARCHAR(36) NULL,
      created_by VARCHAR(36) NULL,
      updated_by VARCHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY event_finance_payment_unique (payment_id),
      KEY event_finance_event_idx (event_id),
      KEY event_finance_scope_idx (scope, region_id),
      KEY event_finance_status_idx (status)
    )
  `)

  for (const name of INCOME_CATEGORIES) {
    await connection.query(
      `
        INSERT INTO event_finance_categories (id, name, type, scope)
        VALUES (:id, :name, 'income', 'global')
        ON DUPLICATE KEY UPDATE is_active = 1
      `,
      { id: `finance-cat-income-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name },
    )
  }

  for (const name of EXPENSE_CATEGORIES) {
    await connection.query(
      `
        INSERT INTO event_finance_categories (id, name, type, scope)
        VALUES (:id, :name, 'expense', 'global')
        ON DUPLICATE KEY UPDATE is_active = 1
      `,
      { id: `finance-cat-expense-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name },
    )
  }
}

function assertEventScope(session: AdminSession, event: EventScopeRow) {
  if (session.role === AUTH_ROLES.superAdmin) return
  if (session.role !== AUTH_ROLES.regionalAdmin || event.scope !== 'regional' || event.region_id !== session.regionalId) {
    throw new Error('Regional scope tidak valid')
  }
}

async function getEventForFinance(connection: PoolConnection, eventId: string) {
  const [rows] = await connection.query<EventScopeRow[]>(
    'SELECT id, title, scope, region_id FROM mpj_event_events WHERE id = :eventId LIMIT 1',
    { eventId },
  )
  if (!rows[0]) throw new Error('Event tidak ditemukan')
  return rows[0]
}

async function getCategory(connection: PoolConnection, type: FinanceTransactionType, categoryId?: string) {
  if (categoryId) {
    const [rows] = await connection.query<FinanceCategoryRow[]>(
      'SELECT * FROM event_finance_categories WHERE id = :categoryId AND type = :type AND is_active = 1 LIMIT 1',
      { categoryId, type },
    )
    if (!rows[0]) throw new Error('Kategori transaksi tidak valid')
    return rows[0]
  }

  const defaultName = type === 'income' ? 'Lainnya' : 'Lainnya'
  const [rows] = await connection.query<FinanceCategoryRow[]>(
    'SELECT * FROM event_finance_categories WHERE name = :defaultName AND type = :type AND is_active = 1 LIMIT 1',
    { defaultName, type },
  )
  if (!rows[0]) throw new Error('Kategori default belum tersedia')
  return rows[0]
}

function mapTransaction(row: FinanceTransactionRow) {
  return {
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    type: row.type,
    source: row.source,
    categoryId: row.category_id,
    categoryName: row.category_name,
    paymentId: row.payment_id,
    participantId: row.participant_id,
    amount: Number(row.amount || 0),
    title: row.title,
    description: row.description,
    transactionDate: toIso(row.transaction_date),
    proofUrl: row.proof_url,
    status: row.status,
    scope: row.scope,
    regionId: row.region_id,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

async function rowsForTransactions(connection: PoolConnection, whereSql: string, params: Record<string, unknown>) {
  const [rows] = await connection.query<FinanceTransactionRow[]>(
    `
      SELECT t.*, e.title AS event_title, c.name AS category_name
      FROM event_finance_transactions t
      JOIN mpj_event_events e ON e.id = t.event_id
      LEFT JOIN event_finance_categories c ON c.id = t.category_id
      ${whereSql}
      ORDER BY t.transaction_date DESC, t.created_at DESC
    `,
    params as never,
  )
  return rows.map(mapTransaction)
}

export async function syncPaymentFinanceTransaction(connection: PoolConnection, paymentId: string) {
  await ensureFinanceSchema(connection)
  if (!paymentId) return null

  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT
        pc.id AS payment_id,
        pc.source_id AS participant_id,
        pc.amount_snapshot,
        pc.verified_at,
        p.event_id,
        p.full_name,
        p.registration_path,
        e.scope,
        e.region_id
      FROM mpj_payment_core_payments pc
      JOIN mpj_event_participants p ON p.id = pc.source_id
      JOIN mpj_event_events e ON e.id = p.event_id
      WHERE pc.id = :paymentId
        AND pc.source_type = 'event_registration'
        AND pc.status = 'verified'
      LIMIT 1
    `,
    { paymentId },
  )
  const row = rows[0]
  if (!row) return null

  const category = await getCategory(connection, 'income', 'finance-cat-income-htm-peserta')
  await connection.query(
    `
      INSERT INTO event_finance_transactions (
        id, event_id, type, source, category_id, payment_id, participant_id,
        amount, title, description, transaction_date, status, scope, region_id, created_by
      )
      VALUES (
        :id, :eventId, 'income', 'payment', :categoryId, :paymentId, :participantId,
        :amount, :title, :description, COALESCE(:verifiedAt, NOW()), 'posted', :scope, :regionId, 'system'
      )
      ON DUPLICATE KEY UPDATE
        amount = VALUES(amount),
        status = 'posted',
        transaction_date = VALUES(transaction_date),
        updated_by = 'system'
    `,
    {
      id: randomUUID(),
      eventId: row.event_id,
      categoryId: category.id,
      paymentId,
      participantId: row.participant_id,
      amount: Number(row.amount_snapshot || 0),
      title: `Payment Peserta - ${row.full_name || row.registration_path || 'Peserta'}`,
      description: 'Pemasukan otomatis dari Payment Core',
      verifiedAt: row.verified_at ?? null,
      scope: row.scope,
      regionId: row.region_id ?? null,
    },
  )

  return paymentId
}

export async function listFinanceCategories() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureFinanceSchema(connection)
      const [rows] = await connection.query<FinanceCategoryRow[]>(
        'SELECT * FROM event_finance_categories WHERE is_active = 1 ORDER BY type ASC, name ASC',
      )
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        scope: row.scope,
        isActive: Boolean(row.is_active),
      }))
    } finally {
      connection.release()
    }
  })
}

export async function listPaymentMonitoring(session: AdminSession, filters: { eventId?: string; status?: string; dateStart?: string; dateEnd?: string }) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureFinanceSchema(connection)
      const clauses = ["pc.source_type = 'event_registration'"]
      const params: Record<string, unknown> = {}

      if (session.role === AUTH_ROLES.regionalAdmin) {
        clauses.push("e.scope = 'regional' AND e.region_id = :regionalId")
        params.regionalId = session.regionalId
      }
      if (filters.eventId) {
        clauses.push('e.id = :eventId')
        params.eventId = filters.eventId
      }
      if (filters.status && filters.status !== 'ALL') {
        clauses.push('pc.status = :status')
        params.status = filters.status
      }
      if (filters.dateStart) {
        clauses.push('DATE(pc.created_at) >= :dateStart')
        params.dateStart = filters.dateStart
      }
      if (filters.dateEnd) {
        clauses.push('DATE(pc.created_at) <= :dateEnd')
        params.dateEnd = filters.dateEnd
      }

      const [rows] = await connection.query<PaymentMonitorRow[]>(
        `
          SELECT
            pc.id AS payment_id,
            e.id AS event_id,
            e.title AS event_title,
            e.scope AS event_scope,
            e.region_id AS event_region_id,
            p.id AS participant_id,
            p.full_name AS participant_name,
            p.registration_path,
            pc.amount_snapshot AS amount,
            pc.status,
            pc.payment_method,
            pc.payment_channel,
            COALESCE(pc.verified_at, pc.paid_at) AS payment_date,
            pc.created_at
          FROM mpj_payment_core_payments pc
          JOIN mpj_event_participants p ON p.id = pc.source_id
          JOIN mpj_event_events e ON e.id = p.event_id
          WHERE ${clauses.join(' AND ')}
          ORDER BY pc.created_at DESC
        `,
        params as never,
      )

      return rows.map((row) => ({
        paymentId: row.payment_id,
        eventId: row.event_id,
        eventTitle: row.event_title,
        scope: row.event_scope,
        regionId: row.event_region_id,
        participantId: row.participant_id,
        participantName: row.participant_name ?? '-',
        path: row.registration_path,
        amount: Number(row.amount || 0),
        status: row.status,
        paymentMethod: row.payment_method,
        paymentChannel: row.payment_channel,
        paymentDate: toIso(row.payment_date),
        createdAt: toIso(row.created_at),
      }))
    } finally {
      connection.release()
    }
  })
}

export async function getFinanceSummary(session: AdminSession, filters: { eventId?: string; dateStart?: string; dateEnd?: string } = {}) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureFinanceSchema(connection)
      const clauses = ["t.status = 'posted'"]
      const params: Record<string, unknown> = {}

      if (session.role === AUTH_ROLES.regionalAdmin) {
        clauses.push("t.scope = 'regional' AND t.region_id = :regionalId")
        params.regionalId = session.regionalId
      }
      if (filters.eventId) {
        clauses.push('t.event_id = :eventId')
        params.eventId = filters.eventId
      }
      if (filters.dateStart) {
        clauses.push('DATE(t.transaction_date) >= :dateStart')
        params.dateStart = filters.dateStart
      }
      if (filters.dateEnd) {
        clauses.push('DATE(t.transaction_date) <= :dateEnd')
        params.dateEnd = filters.dateEnd
      }

      const [summaryRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income_total,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense_total,
            COUNT(*) AS transaction_count,
            COUNT(DISTINCT event_id) AS event_count
          FROM event_finance_transactions t
          WHERE ${clauses.join(' AND ')}
        `,
        params as never,
      )
      const row = summaryRows[0] ?? {}
      const income = Number(row.income_total || 0)
      const expense = Number(row.expense_total || 0)
      return {
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        eventCount: Number(row.event_count || 0),
        transactionCount: Number(row.transaction_count || 0),
      }
    } finally {
      connection.release()
    }
  })
}

export async function listFinanceRecap(session: AdminSession, filters: { eventId?: string; dateStart?: string; dateEnd?: string } = {}) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureFinanceSchema(connection)
      const clauses = ["(t.id IS NULL OR t.status = 'posted')"]
      const params: Record<string, unknown> = {}

      if (session.role === AUTH_ROLES.regionalAdmin) {
        clauses.push("e.scope = 'regional' AND e.region_id = :regionalId")
        params.regionalId = session.regionalId
      }
      if (filters.eventId) {
        clauses.push('e.id = :eventId')
        params.eventId = filters.eventId
      }
      if (filters.dateStart) {
        clauses.push('DATE(t.transaction_date) >= :dateStart')
        params.dateStart = filters.dateStart
      }
      if (filters.dateEnd) {
        clauses.push('DATE(t.transaction_date) <= :dateEnd')
        params.dateEnd = filters.dateEnd
      }

      const [rows] = await connection.query<EventRecapRow[]>(
        `
          SELECT
            e.id AS event_id,
            e.title AS event_title,
            e.scope,
            e.region_id,
            COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income_total,
            COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense_total,
            COUNT(t.id) AS transaction_count
          FROM mpj_event_events e
          LEFT JOIN event_finance_transactions t ON t.event_id = e.id AND t.status = 'posted'
          WHERE ${clauses.join(' AND ')}
          GROUP BY e.id, e.title, e.scope, e.region_id
          ORDER BY e.start_date DESC
        `,
        params as never,
      )

      return rows.map((row) => {
        const income = Number(row.income_total || 0)
        const expense = Number(row.expense_total || 0)
        return {
          eventId: row.event_id,
          eventTitle: row.event_title,
          scope: row.scope,
          regionId: row.region_id,
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
          transactionCount: Number(row.transaction_count || 0),
        }
      })
    } finally {
      connection.release()
    }
  })
}

export async function getEventFinance(session: AdminSession, eventId: string, filters: { type?: string; categoryId?: string; dateStart?: string; dateEnd?: string } = {}) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureFinanceSchema(connection)
      const event = await getEventForFinance(connection, eventId)
      assertEventScope(session, event)

      const clauses = ['t.event_id = :eventId']
      const params: Record<string, unknown> = { eventId }
      if (filters.type && filters.type !== 'ALL') {
        clauses.push('t.type = :type')
        params.type = filters.type
      }
      if (filters.categoryId && filters.categoryId !== 'ALL') {
        clauses.push('t.category_id = :categoryId')
        params.categoryId = filters.categoryId
      }
      if (filters.dateStart) {
        clauses.push('DATE(t.transaction_date) >= :dateStart')
        params.dateStart = filters.dateStart
      }
      if (filters.dateEnd) {
        clauses.push('DATE(t.transaction_date) <= :dateEnd')
        params.dateEnd = filters.dateEnd
      }

      const [summary, transactions, categories] = await Promise.all([
        getFinanceSummary(session, { eventId }),
        rowsForTransactions(connection, `WHERE ${clauses.join(' AND ')}`, params),
        connection.query<FinanceCategoryRow[]>('SELECT * FROM event_finance_categories WHERE is_active = 1 ORDER BY type ASC, name ASC'),
      ])

      return {
        event: { id: event.id, title: event.title, scope: event.scope, regionId: event.region_id },
        summary,
        transactions,
        categories: categories[0].map((row) => ({ id: row.id, name: row.name, type: row.type })),
      }
    } finally {
      connection.release()
    }
  })
}

export async function createManualFinanceTransaction(session: AdminSession, eventId: string, payload: FinanceTransactionPayload) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureFinanceSchema(connection)
      const event = await getEventForFinance(connection, eventId)
      assertEventScope(session, event)

      const type = payload.type === 'expense' ? 'expense' : 'income'
      const amount = Number(payload.amount || 0)
      const title = String(payload.title || '').trim()
      if (!title) throw new Error('Judul transaksi wajib diisi')
      if (!Number.isFinite(amount) || amount < 1) throw new Error('Nominal transaksi wajib lebih dari 0')
      const category = await getCategory(connection, type, payload.categoryId)
      const id = randomUUID()

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO event_finance_transactions (
            id, event_id, type, source, category_id, amount, title, description,
            transaction_date, proof_url, status, scope, region_id, created_by, updated_by
          )
          VALUES (
            :id, :eventId, :type, 'manual', :categoryId, :amount, :title, :description,
            COALESCE(:transactionDate, NOW()), :proofUrl, 'posted', :scope, :regionId, :createdBy, :updatedBy
          )
        `,
        {
          id,
          eventId,
          type,
          categoryId: category.id,
          amount,
          title,
          description: payload.description ?? null,
          transactionDate: payload.transactionDate ? new Date(payload.transactionDate) : null,
          proofUrl: payload.proofUrl ?? null,
          scope: event.scope,
          regionId: event.region_id,
          createdBy: session.userId,
          updatedBy: session.userId,
        },
      )

      const transactions = await rowsForTransactions(connection, 'WHERE t.id = :id', { id })
      return transactions[0]
    } finally {
      connection.release()
    }
  })
}

export async function updateManualFinanceTransaction(session: AdminSession, eventId: string, transactionId: string, payload: FinanceTransactionPayload) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureFinanceSchema(connection)
      const event = await getEventForFinance(connection, eventId)
      assertEventScope(session, event)
      const [existingRows] = await connection.query<FinanceTransactionRow[]>(
        'SELECT * FROM event_finance_transactions WHERE id = :transactionId AND event_id = :eventId LIMIT 1',
        { transactionId, eventId },
      )
      const existing = existingRows[0]
      if (!existing) throw new Error('Transaksi tidak ditemukan')
      if (existing.source === 'payment') throw new Error('Transaksi payment tidak bisa diedit manual')
      if (existing.status === 'void') throw new Error('Transaksi void tidak bisa diedit')

      const type = payload.type === 'expense' ? 'expense' : payload.type === 'income' ? 'income' : existing.type
      const category = await getCategory(connection, type, payload.categoryId ?? existing.category_id)
      const amount = payload.amount === undefined ? Number(existing.amount) : Number(payload.amount)
      const title = payload.title === undefined ? existing.title : String(payload.title).trim()
      if (!title) throw new Error('Judul transaksi wajib diisi')
      if (!Number.isFinite(amount) || amount < 1) throw new Error('Nominal transaksi wajib lebih dari 0')

      await connection.query(
        `
          UPDATE event_finance_transactions
          SET type = :type,
              category_id = :categoryId,
              amount = :amount,
              title = :title,
              description = :description,
              transaction_date = COALESCE(:transactionDate, transaction_date),
              proof_url = COALESCE(:proofUrl, proof_url),
              updated_by = :updatedBy
          WHERE id = :transactionId AND event_id = :eventId
        `,
        {
          transactionId,
          eventId,
          type,
          categoryId: category.id,
          amount,
          title,
          description: payload.description ?? existing.description,
          transactionDate: payload.transactionDate ? new Date(payload.transactionDate) : null,
          proofUrl: payload.proofUrl ?? null,
          updatedBy: session.userId,
        },
      )

      const transactions = await rowsForTransactions(connection, 'WHERE t.id = :transactionId', { transactionId })
      return transactions[0]
    } finally {
      connection.release()
    }
  })
}

export async function voidManualFinanceTransaction(session: AdminSession, eventId: string, transactionId: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureFinanceSchema(connection)
      const event = await getEventForFinance(connection, eventId)
      assertEventScope(session, event)
      const [rows] = await connection.query<FinanceTransactionRow[]>(
        'SELECT * FROM event_finance_transactions WHERE id = :transactionId AND event_id = :eventId LIMIT 1',
        { transactionId, eventId },
      )
      const existing = rows[0]
      if (!existing) throw new Error('Transaksi tidak ditemukan')
      if (existing.source === 'payment') throw new Error('Transaksi payment tidak bisa di-void manual')

      await connection.query(
        "UPDATE event_finance_transactions SET status = 'void', updated_by = :updatedBy WHERE id = :transactionId",
        { transactionId, updatedBy: session.userId },
      )
      const transactions = await rowsForTransactions(connection, 'WHERE t.id = :transactionId', { transactionId })
      return transactions[0]
    } finally {
      connection.release()
    }
  })
}
