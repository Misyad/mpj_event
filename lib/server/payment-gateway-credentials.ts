import crypto, { randomUUID } from 'crypto'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { Event } from '@/types'
import { withDb } from '@/lib/server/db'
import { ensureRbacSchema } from '@/lib/server/rbac'

export type GatewayCredentialOwnerType = 'pusat' | 'regional'

export type GatewayCredentialSummary = {
  id: string
  ownerType: GatewayCredentialOwnerType
  regionalId: string | null
  regionalName: string | null
  provider: 'paymenku'
  apiKeyMasked: string
  webhookSecretMasked: string
  isActive: boolean
  updatedAt: string | null
}

export type RegionalGatewayCredentialStatus = {
  regionalId: string
  regionalName: string
  regionalCode: string
  regionalStatus: string
  hasCredential: boolean
  apiKeyMasked: string
  isActive: boolean
  updatedAt: string | null
}

export type GatewayCredentialSecrets = {
  id: string
  ownerType: GatewayCredentialOwnerType
  regionalId: string | null
  provider: 'paymenku'
  apiKey: string
  webhookSecret: string
}

type CredentialRow = RowDataPacket & {
  id: string
  owner_type: GatewayCredentialOwnerType
  regional_id: string | null
  regional_name: string | null
  regional_code?: string | null
  regional_status?: string | null
  provider: 'paymenku'
  api_key_encrypted: string
  webhook_secret_encrypted: string
  api_key_last4: string | null
  webhook_secret_last4: string | null
  is_active: 0 | 1
  updated_at: Date | string | null
}

function encryptionKey() {
  const secret =
    process.env.PAYMENT_CREDENTIAL_ENCRYPTION_KEY ||
    process.env.PAYMENKU_CREDENTIAL_ENCRYPTION_KEY ||
    process.env.AUTH_TOKEN_SECRET ||
    process.env.ADMIN_API_TOKEN

  if (!secret) {
    throw new Error('PAYMENT_CREDENTIAL_ENCRYPTION_KEY belum dikonfigurasi')
  }

  return crypto.createHash('sha256').update(secret).digest()
}

function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

function decryptSecret(value: string) {
  const [ivHex, tagHex, encryptedHex] = value.split(':')
  if (!ivHex || !tagHex || !encryptedHex) throw new Error('Format credential gateway tidak valid')

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8')
}

function maskSecret(last4: string | null | undefined) {
  return last4 ? `•••• ${last4}` : 'Belum diatur'
}

function toIsoString(value: Date | string | null) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function normalizeOwnerType(value: unknown): GatewayCredentialOwnerType {
  return value === 'regional' ? 'regional' : 'pusat'
}

export async function ensureGatewayCredentialSchema(connection: PoolConnection) {
  await ensureRbacSchema(connection)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payment_gateway_credentials (
      id VARCHAR(36) NOT NULL,
      owner_type VARCHAR(20) NOT NULL,
      regional_id VARCHAR(36) NULL,
      provider VARCHAR(50) NOT NULL DEFAULT 'paymenku',
      api_key_encrypted TEXT NOT NULL,
      webhook_secret_encrypted TEXT NOT NULL,
      api_key_last4 VARCHAR(12) NULL,
      webhook_secret_last4 VARCHAR(12) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY payment_gateway_owner_provider_unique (owner_type, regional_id, provider),
      KEY payment_gateway_regional_idx (regional_id)
    )
  `)
}

function mapSummary(row: CredentialRow): GatewayCredentialSummary {
  return {
    id: row.id,
    ownerType: row.owner_type,
    regionalId: row.regional_id,
    regionalName: row.regional_name,
    provider: 'paymenku',
    apiKeyMasked: maskSecret(row.api_key_last4),
    webhookSecretMasked: maskSecret(row.webhook_secret_last4),
    isActive: Boolean(row.is_active),
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapSecrets(row: CredentialRow): GatewayCredentialSecrets {
  return {
    id: row.id,
    ownerType: row.owner_type,
    regionalId: row.regional_id,
    provider: 'paymenku',
    apiKey: decryptSecret(row.api_key_encrypted),
    webhookSecret: decryptSecret(row.webhook_secret_encrypted),
  }
}

export async function listGatewayCredentials() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureGatewayCredentialSchema(connection)
      const [rows] = await connection.query<CredentialRow[]>(`
        SELECT
          c.*,
          r.name AS regional_name
        FROM payment_gateway_credentials c
        LEFT JOIN regionals r ON r.id = c.regional_id
        WHERE c.provider = 'paymenku'
        ORDER BY c.owner_type ASC, r.name ASC, c.updated_at DESC
      `)
      return rows.map(mapSummary)
    } finally {
      connection.release()
    }
  })
}

export async function getPusatGatewayCredentialSummary() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureGatewayCredentialSchema(connection)
      const [rows] = await connection.query<CredentialRow[]>(
        `
          SELECT c.*, NULL AS regional_name
          FROM payment_gateway_credentials c
          WHERE c.owner_type = 'pusat'
            AND c.provider = 'paymenku'
            AND c.regional_id IS NULL
          ORDER BY c.updated_at DESC
          LIMIT 1
        `,
      )
      return rows[0] ? mapSummary(rows[0]) : null
    } finally {
      connection.release()
    }
  })
}

export async function getGatewayCredentialSummaryForRegional(regionalId: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureGatewayCredentialSchema(connection)
      const [rows] = await connection.query<CredentialRow[]>(
        `
          SELECT c.*, r.name AS regional_name
          FROM payment_gateway_credentials c
          LEFT JOIN regionals r ON r.id = c.regional_id
          WHERE c.owner_type = 'regional'
            AND c.provider = 'paymenku'
            AND c.regional_id = :regionalId
          ORDER BY c.updated_at DESC
          LIMIT 1
        `,
        { regionalId },
      )
      return rows[0] ? mapSummary(rows[0]) : null
    } finally {
      connection.release()
    }
  })
}

export async function listRegionalCredentialStatuses() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureGatewayCredentialSchema(connection)
      const [rows] = await connection.query<CredentialRow[]>(
        `
          SELECT
            c.*,
            r.id AS regional_id,
            r.name AS regional_name,
            r.code AS regional_code,
            r.status AS regional_status
          FROM regionals r
          LEFT JOIN payment_gateway_credentials c
            ON c.owner_type = 'regional'
           AND c.provider = 'paymenku'
           AND c.regional_id = r.id
          ORDER BY r.name ASC
        `,
      )

      return rows.map((row): RegionalGatewayCredentialStatus => ({
        regionalId: String(row.regional_id),
        regionalName: String(row.regional_name || row.regional_id),
        regionalCode: String(row.regional_code || ''),
        regionalStatus: String(row.regional_status || 'active'),
        hasCredential: Boolean(row.id),
        apiKeyMasked: maskSecret(row.api_key_last4),
        isActive: Boolean(row.id && row.is_active),
        updatedAt: toIsoString(row.updated_at),
      }))
    } finally {
      connection.release()
    }
  })
}

export async function upsertGatewayCredential(payload: {
  ownerType: GatewayCredentialOwnerType
  regionalId?: string | null
  apiKey: string
  webhookSecret: string
  isActive?: boolean
}) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureGatewayCredentialSchema(connection)

      const ownerType = normalizeOwnerType(payload.ownerType)
      const regionalId = ownerType === 'regional' ? payload.regionalId || null : null
      if (ownerType === 'regional' && !regionalId) throw new Error('Regional wajib dipilih')

      const apiKey = payload.apiKey.trim()
      const webhookSecret = payload.webhookSecret.trim()
      if (!apiKey || !webhookSecret) throw new Error('API key dan webhook secret wajib diisi')

      const [existingRows] = await connection.query<CredentialRow[]>(
        `
          SELECT id
          FROM payment_gateway_credentials
          WHERE owner_type = :ownerType
            AND provider = 'paymenku'
            AND ((:regionalId IS NULL AND regional_id IS NULL) OR regional_id = :regionalId)
          LIMIT 1
        `,
        { ownerType, regionalId },
      )
      const id = existingRows[0]?.id || randomUUID()

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO payment_gateway_credentials (
            id, owner_type, regional_id, provider,
            api_key_encrypted, webhook_secret_encrypted,
            api_key_last4, webhook_secret_last4, is_active
          ) VALUES (
            :id, :ownerType, :regionalId, 'paymenku',
            :apiKeyEncrypted, :webhookSecretEncrypted,
            :apiKeyLast4, :webhookSecretLast4, :isActive
          )
          ON DUPLICATE KEY UPDATE
            api_key_encrypted = VALUES(api_key_encrypted),
            webhook_secret_encrypted = VALUES(webhook_secret_encrypted),
            api_key_last4 = VALUES(api_key_last4),
            webhook_secret_last4 = VALUES(webhook_secret_last4),
            is_active = VALUES(is_active)
        `,
        {
          id,
          ownerType,
          regionalId,
          apiKeyEncrypted: encryptSecret(apiKey),
          webhookSecretEncrypted: encryptSecret(webhookSecret),
          apiKeyLast4: apiKey.slice(-4),
          webhookSecretLast4: webhookSecret.slice(-4),
          isActive: payload.isActive === false ? 0 : 1,
        },
      )

      return { id }
    } finally {
      connection.release()
    }
  })
}

export async function upsertPusatGatewayCredential(apiKey: string, webhookSecret: string, isActive?: boolean) {
  return upsertGatewayCredential({
    ownerType: 'pusat',
    regionalId: null,
    apiKey,
    webhookSecret,
    isActive,
  })
}

export async function upsertRegionalGatewayCredential(
  regionalId: string,
  apiKey: string,
  webhookSecret: string,
  isActive?: boolean,
) {
  return upsertGatewayCredential({
    ownerType: 'regional',
    regionalId,
    apiKey,
    webhookSecret,
    isActive,
  })
}

async function getCredentialByOwner(connection: PoolConnection, ownerType: GatewayCredentialOwnerType, regionalId: string | null) {
  await ensureGatewayCredentialSchema(connection)
  const [rows] = await connection.query<CredentialRow[]>(
    `
      SELECT c.*, r.name AS regional_name
      FROM payment_gateway_credentials c
      LEFT JOIN regionals r ON r.id = c.regional_id
      WHERE c.owner_type = :ownerType
        AND c.provider = 'paymenku'
        AND c.is_active = 1
        AND ((:regionalId IS NULL AND c.regional_id IS NULL) OR c.regional_id = :regionalId)
      LIMIT 1
    `,
    { ownerType, regionalId },
  )
  return rows[0] ? mapSecrets(rows[0]) : null
}

export async function getGatewayCredentialForEvent(event: Event) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      const ownerType = event.scope === 'regional' ? 'regional' : 'pusat'
      const regionalId = ownerType === 'regional' ? event.regionId ?? null : null
      const credential = await getCredentialByOwner(connection, ownerType, regionalId)
      if (!credential) {
        throw new Error(ownerType === 'regional'
          ? 'Credential Paymenku regional belum dikonfigurasi'
          : 'Credential Paymenku pusat belum dikonfigurasi')
      }
      return credential
    } finally {
      connection.release()
    }
  })
}

export async function getGatewayCredentialForOwner(ownerType: GatewayCredentialOwnerType, regionalId?: string | null) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      const normalizedOwnerType = normalizeOwnerType(ownerType)
      const credential = await getCredentialByOwner(connection, normalizedOwnerType, normalizedOwnerType === 'regional' ? regionalId || null : null)
      if (!credential) {
        throw new Error(normalizedOwnerType === 'regional'
          ? 'Credential Paymenku regional belum dikonfigurasi'
          : 'Credential Paymenku pusat belum dikonfigurasi')
      }
      return credential
    } finally {
      connection.release()
    }
  })
}

export async function getGatewayCredentialForPayment(reference: { paymentId?: string; externalRef?: string }) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureGatewayCredentialSchema(connection)
      const paymentId = reference.paymentId?.trim() ?? ''
      const externalRef = reference.externalRef?.trim() ?? ''
      const [rows] = await connection.query<Array<RowDataPacket & {
        event_scope: string | null
        event_region_id: string | null
      }>>(
        `
          SELECT e.scope AS event_scope, e.region_id AS event_region_id
          FROM mpj_payment_core_payments pc
          JOIN mpj_event_participants p ON p.id = pc.source_id AND pc.source_type = 'event_registration'
          JOIN mpj_event_events e ON e.id = p.event_id
          WHERE (:paymentId <> '' AND pc.id = :paymentId)
            OR (:externalRef <> '' AND pc.external_ref = :externalRef)
          LIMIT 1
        `,
        { paymentId, externalRef },
      )
      const row = rows[0]
      if (!row) throw new Error('Payment Core record tidak ditemukan')

      const ownerType = row.event_scope === 'regional' ? 'regional' : 'pusat'
      const regionalId = ownerType === 'regional' ? String(row.event_region_id || '') : null
      const credential = await getCredentialByOwner(connection, ownerType, regionalId)
      if (!credential) {
        throw new Error(ownerType === 'regional'
          ? 'Credential Paymenku regional belum dikonfigurasi'
          : 'Credential Paymenku pusat belum dikonfigurasi')
      }
      return credential
    } finally {
      connection.release()
    }
  })
}
