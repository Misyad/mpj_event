import { randomUUID } from 'crypto'
import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import type { NextRequest } from 'next/server'
import type { RegistrationPayload } from '@/lib/auth/registration-security'
import { sanitizeEmailForLog } from '@/lib/auth/registration-security'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { withDb } from '@/lib/server/db'
import { ensureRbacSchema, hashPassword } from '@/lib/server/rbac'

type PublicUserAccount = {
  id: string
  fullName: string
  email: string
  role: typeof AUTH_ROLES.user
}

type PendingRegistration = RegistrationPayload & {
  otpCode: string
  expiresAt: number
  attempts: number
  lastSentAt: number
}

const pendingRegistrations = new Map<string, PendingRegistration>()

const OTP_VALID_MINUTES = process.env.OTP_VALID_MINUTES ? Number(process.env.OTP_VALID_MINUTES) : 10
const OTP_RESEND_COOLDOWN_SECONDS = 30

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function cleanupPendingRegistrations() {
  const now = Date.now()
  for (const [email, pending] of pendingRegistrations.entries()) {
    if (pending.expiresAt < now) pendingRegistrations.delete(email)
  }
}

function generateOtpCode() {
  return Math.random().toString().slice(2, 8).padStart(6, '0')
}

async function findUserByEmail(connection: PoolConnection, email: string) {
  const [rows] = await connection.query<RowDataPacket[]>('SELECT id, email FROM users WHERE email = :email LIMIT 1', { email })
  return rows[0] ?? null
}

async function getUserRoleId(connection: PoolConnection) {
  const [rows] = await connection.query<RowDataPacket[]>('SELECT id FROM roles WHERE code = :code LIMIT 1', {
    code: AUTH_ROLES.user,
  })
  const roleId = rows[0]?.id ? String(rows[0].id) : null
  if (!roleId) throw new Error('Role user belum tersedia')
  return roleId
}

async function createPublicUserAccountInConnection(
  connection: PoolConnection,
  payload: RegistrationPayload,
): Promise<PublicUserAccount> {
  const email = normalizeEmail(payload.email)
  const existing = await findUserByEmail(connection, email)
  if (existing) throw new Error('Akun sudah terdaftar, silakan login.')

  const roleId = await getUserRoleId(connection)
  const userId = randomUUID()

  await connection.beginTransaction()
  try {
    await connection.query(
      `
        INSERT INTO users (id, full_name, email, password_hash, whatsapp, status, email_verified_at)
        VALUES (:id, :fullName, :email, :passwordHash, :whatsapp, 'active', NOW())
      `,
      {
        id: userId,
        fullName: payload.fullName.trim(),
        email,
        passwordHash: hashPassword(payload.password),
        whatsapp: payload.whatsapp?.trim() || null,
      },
    )

    await connection.query(
      `
        INSERT INTO user_roles (user_id, role_id)
        VALUES (:userId, :roleId)
        ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)
      `,
      { userId, roleId },
    )

    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  }

  const [dbRows] = await connection.query<RowDataPacket[]>('SELECT DATABASE() AS databaseName')
  const user = {
    id: userId,
    fullName: payload.fullName.trim(),
    email,
    role: AUTH_ROLES.user,
  }

  console.log('USER CREATED:', {
    ...user,
    databaseName: dbRows[0]?.databaseName ? String(dbRows[0].databaseName) : null,
  })

  return user
}

export async function assertPublicUserEmailAvailable(emailInput: string) {
  const email = normalizeEmail(emailInput)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const existing = await findUserByEmail(connection, email)
      if (existing) throw new Error('Akun sudah terdaftar, silakan login.')
    } finally {
      connection.release()
    }
  })
}

export async function createPublicUserAccount(payload: RegistrationPayload) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      return await createPublicUserAccountInConnection(connection, {
        ...payload,
        email: normalizeEmail(payload.email),
      })
    } finally {
      connection.release()
    }
  })
}

export async function storePendingRegistration(payload: RegistrationPayload) {
  await assertPublicUserEmailAvailable(payload.email)

  cleanupPendingRegistrations()
  const email = normalizeEmail(payload.email)
  const existing = pendingRegistrations.get(email)
  const now = Date.now()
  const lastSentAt = existing?.lastSentAt || 0
  const timeSinceLastSend = (now - lastSentAt) / 1000

  if (existing && timeSinceLastSend < OTP_RESEND_COOLDOWN_SECONDS) {
    throw new Error(`Silakan tunggu ${Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - timeSinceLastSend)} detik sebelum meminta ulang`)
  }

  const otpCode = generateOtpCode()
  const expiresAt = now + OTP_VALID_MINUTES * 60 * 1000
  const canResendAt = now + OTP_RESEND_COOLDOWN_SECONDS * 1000

  pendingRegistrations.set(email, {
    ...payload,
    email,
    otpCode,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
  })

  console.log(`[OTP GENERATED] ${sanitizeEmailForLog(email)} | Code: ${otpCode} | Valid: ${OTP_VALID_MINUTES} min`)

  return { code: otpCode, expiresAt, canResendAt }
}

export async function verifyPendingRegistration(emailInput: string, otpCode: string) {
  cleanupPendingRegistrations()
  const email = normalizeEmail(emailInput)
  const pending = pendingRegistrations.get(email)

  if (!pending) return null
  if (pending.expiresAt < Date.now()) {
    pendingRegistrations.delete(email)
    return null
  }
  if (pending.otpCode !== otpCode) {
    pending.attempts += 1
    if (pending.attempts >= 5) {
      pendingRegistrations.delete(email)
      throw new Error('Terlalu banyak percobaan. Silakan minta OTP baru')
    }
    return null
  }

  const user = await createPublicUserAccount(pending)
  pendingRegistrations.delete(email)
  return user
}

export async function getUsersDebugSnapshot() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const [dbRows] = await connection.query<RowDataPacket[]>('SELECT DATABASE() AS databaseName')
      const [countRows] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM users')
      const [users] = await connection.query<RowDataPacket[]>(
        `
          SELECT
            u.id,
            u.full_name,
            u.email,
            u.status,
            u.email_verified_at,
            u.created_at,
            GROUP_CONCAT(r.code ORDER BY r.code SEPARATOR ',') AS roles
          FROM users u
          LEFT JOIN user_roles ur ON ur.user_id = u.id
          LEFT JOIN roles r ON r.id = ur.role_id
          GROUP BY u.id, u.full_name, u.email, u.status, u.email_verified_at, u.created_at
          ORDER BY u.created_at DESC
          LIMIT 10
        `,
      )

      return {
        database: {
          host: process.env.DB_HOST || null,
          name: process.env.DB_NAME || null,
          port: process.env.DB_PORT || '3306',
          selected: dbRows[0]?.databaseName ? String(dbRows[0].databaseName) : null,
        },
        authProvider: 'mysql-rbac-users',
        totalUsers: Number(countRows[0]?.total || 0),
        latestUsers: users.map((user) => ({
          id: String(user.id),
          fullName: String(user.full_name),
          email: String(user.email),
          status: String(user.status),
          emailVerifiedAt: user.email_verified_at instanceof Date ? user.email_verified_at.toISOString() : user.email_verified_at,
          createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
          roles: user.roles ? String(user.roles).split(',') : [],
        })),
      }
    } finally {
      connection.release()
    }
  })
}

export async function seedTestPublicUser(_request?: NextRequest) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const email = 'test@mpjevent.com'
      const existing = await findUserByEmail(connection, email)
      const roleId = await getUserRoleId(connection)

      if (existing) {
        await connection.query(
          `
            INSERT INTO user_roles (user_id, role_id)
            VALUES (:userId, :roleId)
            ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)
          `,
          { userId: String(existing.id), roleId },
        )
        return {
          id: String(existing.id),
          fullName: 'Test MPJ Event',
          email,
          role: AUTH_ROLES.user,
        }
      }

      return await createPublicUserAccountInConnection(connection, {
        fullName: 'Test MPJ Event',
        email,
        whatsapp: '081234567890',
        password: '12345678',
      })
    } finally {
      connection.release()
    }
  })
}
