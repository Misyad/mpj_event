import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { AuthRole } from '@/lib/auth/roles'
import { AUTH_ROLES, getAuthRoleConfig } from '@/lib/auth/roles'
import { ADMIN_PERMISSIONS, ADMIN_REGIONAL_DEFAULT_PERMISSIONS, type AdminPermission, hasPermission } from '@/lib/auth/permissions'
import { createAccessToken, verifyAccessToken, type AccessTokenPayload } from '@/lib/auth/token'
import { withDb } from '@/lib/server/db'

type UserRow = RowDataPacket & {
  id: string
  full_name: string
  email: string
  password_hash: string
  status: 'active' | 'suspended' | 'inactive'
  email_verified_at: Date | string | null
  last_login_at: Date | string | null
}

type AdminRow = RowDataPacket & {
  id: string
  full_name: string
  email: string
  status: string
  last_login_at: Date | string | null
  regional_id: string | null
  regional_name: string | null
  permissions: string | null
  active_sessions: number
}

export type AdminSession = AccessTokenPayload & {
  email?: string
  fullName?: string
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(':')
  if (algorithm !== 'scrypt' || !salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

async function ensureColumn(connection: PoolConnection, tableName: string, columnName: string, definition: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = :tableName
        AND COLUMN_NAME = :columnName
    `,
    { tableName, columnName },
  )

  if (Number(rows[0]?.total || 0) === 0) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`)
  }
}

export async function ensureRbacSchema(connection: PoolConnection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS regionals (
      id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(80) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY regionals_code_unique (code)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      email_verified_at DATETIME NULL,
      last_login_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(36) NOT NULL,
      code VARCHAR(80) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      is_system TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY roles_code_unique (code)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id VARCHAR(36) NOT NULL,
      code VARCHAR(120) NOT NULL,
      name VARCHAR(255) NOT NULL,
      module VARCHAR(80) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY permissions_code_unique (code)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id VARCHAR(36) NOT NULL,
      permission_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (role_id, permission_id)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id VARCHAR(36) NOT NULL,
      role_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, role_id)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_regional_access (
      user_id VARCHAR(36) NOT NULL,
      regional_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, regional_id)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      role_code VARCHAR(80) NOT NULL,
      regional_id VARCHAR(36) NULL,
      refresh_token_hash VARCHAR(255) NOT NULL,
      user_agent VARCHAR(500) NULL,
      ip_address VARCHAR(80) NULL,
      revoked_at DATETIME NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME NULL,
      PRIMARY KEY (id),
      KEY admin_sessions_user_idx (user_id)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NULL,
      action VARCHAR(120) NOT NULL,
      entity_type VARCHAR(120) NULL,
      entity_id VARCHAR(36) NULL,
      metadata JSON NULL,
      ip_address VARCHAR(80) NULL,
      user_agent VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY admin_activity_logs_user_idx (user_id),
      KEY admin_activity_logs_action_idx (action)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_login_history (
      id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NULL,
      email VARCHAR(255) NOT NULL,
      role_code VARCHAR(80) NULL,
      success TINYINT(1) NOT NULL,
      failure_reason VARCHAR(255) NULL,
      ip_address VARCHAR(80) NULL,
      user_agent VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY admin_login_history_email_idx (email)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_invitations (
      id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role_id VARCHAR(36) NOT NULL,
      regional_id VARCHAR(36) NULL,
      token_hash VARCHAR(255) NOT NULL,
      accepted_at DATETIME NULL,
      expires_at DATETIME NOT NULL,
      created_by VARCHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY admin_invitations_email_idx (email)
    )
  `)

  await connection.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      used_at DATETIME NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY password_reset_tokens_user_idx (user_id)
    )
  `)

  await ensureColumn(connection, 'mpj_event_events', 'region_id', 'VARCHAR(36) NULL')
  await ensureColumn(connection, 'mpj_event_events', 'scope', "VARCHAR(20) NOT NULL DEFAULT 'pusat'")
  await seedRbacDefaults(connection)
}

async function upsertRole(connection: PoolConnection, code: string, name: string, description: string) {
  const roleIds: Record<AuthRole, string> = {
    [AUTH_ROLES.superAdmin]: 'role-super-admin',
    [AUTH_ROLES.regionalAdmin]: 'role-regional-admin',
    [AUTH_ROLES.user]: 'role-user',
  }
  const id = roleIds[code as AuthRole] ?? `role-${code}`
  await connection.query(
    `
      INSERT INTO roles (id, code, name, description, is_system)
      VALUES (:id, :code, :name, :description, 1)
      ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
    `,
    { id, code, name, description },
  )
  return id
}

async function seedRbacDefaults(connection: PoolConnection) {
  await connection.query(
    `
      INSERT INTO regionals (id, name, code)
      VALUES
        ('regional-jatim', 'Jawa Timur', 'jatim'),
        ('regional-jabar', 'Jawa Barat', 'jabar')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `,
  )

  const superRoleId = await upsertRole(connection, AUTH_ROLES.superAdmin, 'Super Admin', 'Full access seluruh sistem')
  const regionalRoleId = await upsertRole(connection, AUTH_ROLES.regionalAdmin, 'Admin Regional', 'Admin dengan akses scoped regional')
  const userRoleId = await upsertRole(connection, AUTH_ROLES.user, 'User Publik', 'Akses peserta publik')

  for (const permission of ADMIN_PERMISSIONS) {
    const moduleName = permission === '*' ? 'system' : permission.split('.')[0]
    await connection.query(
      `
        INSERT INTO permissions (id, code, name, module)
        VALUES (:id, :code, :name, :moduleName)
        ON DUPLICATE KEY UPDATE name = VALUES(name), module = VALUES(module)
      `,
      {
        id: `permission-${permission.replace(/[^a-z0-9]/gi, '-')}`,
        code: permission,
        name: permission,
        moduleName,
      },
    )
  }

  await assignPermissions(connection, superRoleId, ['*'])
  await assignPermissions(connection, regionalRoleId, ADMIN_REGIONAL_DEFAULT_PERMISSIONS)
  await assignPermissions(connection, userRoleId, [])

  await upsertSeedUser(connection, {
    id: 'user-super-admin',
    fullName: 'Super Admin MPJ',
    email: 'superadmin@mpj.local',
    password: 'Admin123!',
    roleId: superRoleId,
  })
  await upsertSeedUser(connection, {
    id: 'user-regional-jatim',
    fullName: 'Admin Regional Jawa Timur',
    email: 'regional.jatim@mpj.local',
    password: 'Admin123!',
    roleId: regionalRoleId,
    regionalId: 'regional-jatim',
  })
  await upsertSeedUser(connection, {
    id: 'user-public-demo',
    fullName: 'User Peserta MPJ',
    email: 'user@mpj.local',
    password: 'Admin123!',
    roleId: userRoleId,
  })
}

async function assignPermissions(connection: PoolConnection, roleId: string, permissions: readonly string[]) {
  await connection.query('DELETE FROM role_permissions WHERE role_id = :roleId', { roleId })
  for (const permission of permissions) {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT id FROM permissions WHERE code = :permission LIMIT 1', { permission })
    const permissionId = rows[0]?.id
    if (!permissionId) continue
    await connection.query(
      `
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        VALUES (:roleId, :permissionId)
      `,
      { roleId, permissionId },
    )
  }
}

async function upsertSeedUser(
  connection: PoolConnection,
  payload: { id: string; fullName: string; email: string; password: string; roleId: string; regionalId?: string },
) {
  await connection.query(
    `
      INSERT INTO users (id, full_name, email, password_hash, status, email_verified_at)
      VALUES (:id, :fullName, :email, :passwordHash, 'active', NOW())
      ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)
    `,
    {
      id: payload.id,
      fullName: payload.fullName,
      email: payload.email,
      passwordHash: hashPassword(payload.password),
    },
  )
  await connection.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)', {
    userId: payload.id,
    roleId: payload.roleId,
  })
  if (payload.regionalId) {
    await connection.query('INSERT IGNORE INTO admin_regional_access (user_id, regional_id) VALUES (:userId, :regionalId)', {
      userId: payload.id,
      regionalId: payload.regionalId,
    })
  }
}

export async function ensureRbacSchemaWithDb(db: Pool) {
  const connection = await db.getConnection()
  try {
    await ensureRbacSchema(connection)
  } finally {
    connection.release()
  }
}

function requestMeta(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
    userAgent: request.headers.get('user-agent') || null,
  }
}

async function auditLogin(connection: PoolConnection, payload: {
  userId?: string | null
  email: string
  roleCode?: string | null
  success: boolean
  failureReason?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}) {
  await connection.query<ResultSetHeader>(
    `
      INSERT INTO admin_login_history (id, user_id, email, role_code, success, failure_reason, ip_address, user_agent)
      VALUES (:id, :userId, :email, :roleCode, :success, :failureReason, :ipAddress, :userAgent)
    `,
    {
      id: randomUUID(),
      userId: payload.userId ?? null,
      email: payload.email,
      roleCode: payload.roleCode ?? null,
      success: payload.success ? 1 : 0,
      failureReason: payload.failureReason ?? null,
      ipAddress: payload.ipAddress ?? null,
      userAgent: payload.userAgent ?? null,
    },
  )
}

export async function writeActivityLog(
  connection: PoolConnection,
  payload: {
    userId?: string | null
    action: string
    entityType?: string | null
    entityId?: string | null
    metadata?: Record<string, unknown>
    request?: NextRequest
  },
) {
  const meta = payload.request ? requestMeta(payload.request) : { ipAddress: null, userAgent: null }
  await connection.query<ResultSetHeader>(
    `
      INSERT INTO admin_activity_logs (id, user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
      VALUES (:id, :userId, :action, :entityType, :entityId, CAST(:metadata AS JSON), :ipAddress, :userAgent)
    `,
    {
      id: randomUUID(),
      userId: payload.userId ?? null,
      action: payload.action,
      entityType: payload.entityType ?? null,
      entityId: payload.entityId ?? null,
      metadata: JSON.stringify(payload.metadata ?? {}),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  )
}

async function getUserPermissions(connection: PoolConnection, userId: string, role?: AuthRole) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT DISTINCT p.code
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = :userId
        AND (:role = '' OR r.code = :role)
      ORDER BY p.code ASC
    `,
    { userId, role: role ?? '' },
  )
  return rows.map((row) => String(row.code))
}

async function getUserRoles(connection: PoolConnection, userId: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT r.code
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = :userId
      ORDER BY r.code ASC
    `,
    { userId },
  )

  const roleOrder: AuthRole[] = [AUTH_ROLES.superAdmin, AUTH_ROLES.regionalAdmin, AUTH_ROLES.user]
  const roles = rows
    .map((row) => String(row.code))
    .filter((role): role is AuthRole => roleOrder.includes(role as AuthRole))

  return roles.sort((a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b))
}

async function getRegionalId(connection: PoolConnection, userId: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT regional_id FROM admin_regional_access WHERE user_id = :userId LIMIT 1',
    { userId },
  )
  return (rows[0]?.regional_id as string | undefined) ?? null
}

export async function loginAdmin(request: NextRequest, payload: { role?: AuthRole; email: string; password: string; remember: boolean }) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    const meta = requestMeta(request)
    const requestedRole = payload.role ?? null
    try {
      await ensureRbacSchema(connection)
      const [userRows] = await connection.query<UserRow[]>('SELECT * FROM users WHERE email = :email LIMIT 1', { email: payload.email })
      const user = userRows[0]

      if (!user) {
        await auditLogin(connection, { email: payload.email, roleCode: requestedRole, success: false, failureReason: 'user_not_found', ...meta })
        throw new Error('Email atau password tidak valid')
      }

      if (user.status !== 'active') {
        await auditLogin(connection, { userId: user.id, email: payload.email, roleCode: requestedRole, success: false, failureReason: 'user_suspended', ...meta })
        throw new Error('Akun admin tidak aktif')
      }

      if (!verifyPassword(payload.password, user.password_hash)) {
        await auditLogin(connection, { userId: user.id, email: payload.email, roleCode: requestedRole, success: false, failureReason: 'invalid_password', ...meta })
        throw new Error('Email atau password tidak valid')
      }

      const roles = await getUserRoles(connection, user.id)
      if (roles.length === 0) {
        await auditLogin(connection, { userId: user.id, email: payload.email, roleCode: requestedRole, success: false, failureReason: 'role_not_found', ...meta })
        throw new Error('Akun ini belum memiliki role akses')
      }

      if (!payload.role && roles.length > 1) {
        return {
          requiresRoleSelection: true as const,
          roles,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
          },
        }
      }

      const role = payload.role ?? roles[0]
      if (!roles.includes(role)) {
        await auditLogin(connection, { userId: user.id, email: payload.email, roleCode: role, success: false, failureReason: 'role_mismatch', ...meta })
        throw new Error('Akun ini tidak memiliki akses role yang dipilih')
      }

      const permissions = await getUserPermissions(connection, user.id, role)
      const regionalId = await getRegionalId(connection, user.id)
      if (role === AUTH_ROLES.regionalAdmin && !regionalId) throw new Error('Admin Regional wajib memiliki regional_id')

      const sessionId = randomUUID()
      const refreshToken = randomBytes(32).toString('hex')
      const maxAge = payload.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8
      const expiresAt = new Date(Date.now() + maxAge * 1000)
      const accessToken = await createAccessToken({
        sessionId,
        userId: user.id,
        role,
        regionalId,
        permissions,
        email: user.email,
        fullName: user.full_name,
        exp: Math.floor(expiresAt.getTime() / 1000),
      })

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO admin_sessions (id, user_id, role_code, regional_id, refresh_token_hash, user_agent, ip_address, expires_at, last_seen_at)
          VALUES (:id, :userId, :roleCode, :regionalId, :refreshTokenHash, :userAgent, :ipAddress, :expiresAt, NOW())
        `,
        {
          id: sessionId,
          userId: user.id,
          roleCode: role,
          regionalId,
          refreshTokenHash: hashPassword(refreshToken),
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress,
          expiresAt,
        },
      )
      await connection.query('UPDATE users SET last_login_at = NOW() WHERE id = :userId', { userId: user.id })
      await auditLogin(connection, { userId: user.id, email: payload.email, roleCode: role, success: true, ...meta })
      await writeActivityLog(connection, {
        userId: user.id,
        action: 'admin.login',
        entityType: 'admin_session',
        entityId: sessionId,
        metadata: { role, regionalId },
        request,
      })

      return { user, role, regionalId, permissions, sessionId, accessToken, refreshToken: `${sessionId}.${refreshToken}`, maxAge }
    } finally {
      connection.release()
    }
  })
}

export async function refreshAdminSession(request: NextRequest) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)

      for (const role of [AUTH_ROLES.superAdmin, AUTH_ROLES.regionalAdmin, AUTH_ROLES.user]) {
        const config = getAuthRoleConfig(role)
        const refreshCookie = config ? request.cookies.get(`${config.cookieName}_refresh`)?.value : undefined
        if (!refreshCookie) continue

        const [sessionId, refreshSecret] = refreshCookie.split('.')
        if (!sessionId || !refreshSecret) continue

        const [sessions] = await connection.query<RowDataPacket[]>(
          `
            SELECT s.id, s.user_id, s.role_code, s.regional_id, s.refresh_token_hash, s.expires_at, u.status, u.email, u.full_name
            FROM admin_sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.id = :sessionId
              AND s.role_code = :role
              AND s.revoked_at IS NULL
              AND s.expires_at > NOW()
            LIMIT 1
          `,
          { sessionId, role },
        )
        const session = sessions[0]
        if (!session || session.status !== 'active' || !verifyPassword(refreshSecret, String(session.refresh_token_hash))) continue

        const permissions = await getUserPermissions(connection, String(session.user_id))
        const maxAge = 60 * 60 * 8
        const expiresAt = Math.floor(Date.now() / 1000) + maxAge
        const accessToken = await createAccessToken({
          sessionId: String(session.id),
          userId: String(session.user_id),
          role,
          regionalId: session.regional_id ? String(session.regional_id) : null,
          permissions,
          email: String(session.email),
          fullName: String(session.full_name),
          exp: expiresAt,
        })

        await connection.query('UPDATE admin_sessions SET last_seen_at = NOW() WHERE id = :sessionId', { sessionId })
        return {
          role,
          accessToken,
          maxAge,
          user: {
            id: String(session.user_id),
            email: String(session.email),
            fullName: String(session.full_name),
          },
        }
      }

      throw new Error('Refresh token tidak valid')
    } finally {
      connection.release()
    }
  })
}

export async function revokeCurrentSession(request: NextRequest) {
  const accessSession = await getSessionFromRequest(request)

  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      let session = accessSession

      if (!session) {
        for (const role of [AUTH_ROLES.superAdmin, AUTH_ROLES.regionalAdmin, AUTH_ROLES.user]) {
          const config = getAuthRoleConfig(role)
          const refreshCookie = config ? request.cookies.get(`${config.cookieName}_refresh`)?.value : undefined
          if (!refreshCookie) continue

          const [sessionId, refreshSecret] = refreshCookie.split('.')
          if (!sessionId || !refreshSecret) continue

          const [sessions] = await connection.query<RowDataPacket[]>(
            `
              SELECT id, user_id, role_code, regional_id, refresh_token_hash
              FROM admin_sessions
              WHERE id = :sessionId
                AND role_code = :role
                AND revoked_at IS NULL
              LIMIT 1
            `,
            { sessionId, role },
          )
          const refreshSession = sessions[0]
          if (!refreshSession || !verifyPassword(refreshSecret, String(refreshSession.refresh_token_hash))) continue

          session = {
            sessionId: String(refreshSession.id),
            userId: String(refreshSession.user_id),
            role,
            regionalId: refreshSession.regional_id ? String(refreshSession.regional_id) : null,
            permissions: await getUserPermissions(connection, String(refreshSession.user_id)),
            exp: Math.floor(Date.now() / 1000),
          }
          break
        }
      }

      if (!session) return null

      await connection.query('UPDATE admin_sessions SET revoked_at = NOW() WHERE id = :sessionId AND revoked_at IS NULL', {
        sessionId: session.sessionId,
      })
      await writeActivityLog(connection, {
        userId: session.userId,
        action: 'admin.logout',
        entityType: 'admin_session',
        entityId: session.sessionId,
        request,
      })
      return session
    } finally {
      connection.release()
    }
  })
}

export async function getSessionFromRequest(request: NextRequest, role?: AuthRole): Promise<AdminSession | null> {
  const candidateRoles = role ? [role] : [AUTH_ROLES.superAdmin, AUTH_ROLES.regionalAdmin, AUTH_ROLES.user]
  for (const candidateRole of candidateRoles) {
    const config = getAuthRoleConfig(candidateRole)
    const token = config ? request.cookies.get(config.cookieName)?.value : undefined
    const payload = await verifyAccessToken(token)
    if (payload && payload.role === candidateRole) return payload
  }
  return null
}

export async function getCurrentAdminSession(role?: AuthRole): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const candidateRoles = role ? [role] : [AUTH_ROLES.superAdmin, AUTH_ROLES.regionalAdmin, AUTH_ROLES.user]
  for (const candidateRole of candidateRoles) {
    const config = getAuthRoleConfig(candidateRole)
    const token = config ? cookieStore.get(config.cookieName)?.value : undefined
    const payload = await verifyAccessToken(token)
    if (payload && payload.role === candidateRole) return payload
  }
  return null
}

export async function requireAdminPermission(request: NextRequest, permission: AdminPermission) {
  const session = await getSessionFromRequest(request)
  if (!session) throw new Error('Unauthorized')
  if (!hasPermission(session.permissions, permission)) throw new Error('Forbidden')
  return session
}

export async function requireSuperAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request, AUTH_ROLES.superAdmin)
  if (!session) throw new Error('Unauthorized')
  return session
}

export function requireRegionalScope(session: AdminSession, requestedRegionalId: string | null | undefined) {
  if (session.role === AUTH_ROLES.superAdmin) return requestedRegionalId ?? null
  if (!session.regionalId) throw new Error('Admin Regional tidak memiliki regional_id')
  if (requestedRegionalId && requestedRegionalId !== session.regionalId) throw new Error('Regional scope tidak valid')
  return session.regionalId
}

export async function listRegionalAdmins() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const [rows] = await connection.query<AdminRow[]>(
        `
          SELECT
            u.id,
            u.full_name,
            u.email,
            u.status,
            u.last_login_at,
            ara.regional_id,
            rg.name AS regional_name,
            COUNT(DISTINCT s.id) AS active_sessions,
            GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permissions
          FROM users u
          JOIN user_roles ur ON ur.user_id = u.id
          JOIN roles r ON r.id = ur.role_id
          LEFT JOIN admin_regional_access ara ON ara.user_id = u.id
          LEFT JOIN regionals rg ON rg.id = ara.regional_id
          LEFT JOIN admin_sessions s ON s.user_id = u.id AND s.revoked_at IS NULL AND s.expires_at > NOW()
          LEFT JOIN role_permissions rp ON rp.role_id = r.id
          LEFT JOIN permissions p ON p.id = rp.permission_id
          WHERE r.code = :roleCode
          GROUP BY u.id, u.full_name, u.email, u.status, u.last_login_at, ara.regional_id, rg.name
          ORDER BY u.created_at DESC
        `,
        { roleCode: AUTH_ROLES.regionalAdmin },
      )
      return rows.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        status: row.status,
        lastLoginAt: row.last_login_at instanceof Date ? row.last_login_at.toISOString() : row.last_login_at,
        regionalId: row.regional_id,
        regionalName: row.regional_name,
        activeSessions: Number(row.active_sessions || 0),
        permissions: row.permissions ? row.permissions.split(',') : [],
        totalPeserta: 0,
      }))
    } finally {
      connection.release()
    }
  })
}

export async function listRolesWithPermissions() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const [roles] = await connection.query<RowDataPacket[]>(
        `
          SELECT r.id, r.code, r.name, r.description, GROUP_CONCAT(p.code ORDER BY p.code SEPARATOR ',') AS permissions
          FROM roles r
          LEFT JOIN role_permissions rp ON rp.role_id = r.id
          LEFT JOIN permissions p ON p.id = rp.permission_id
          WHERE r.code IN (:superAdmin, :regionalAdmin)
          GROUP BY r.id, r.code, r.name, r.description
          ORDER BY r.code ASC
        `,
        { superAdmin: AUTH_ROLES.superAdmin, regionalAdmin: AUTH_ROLES.regionalAdmin },
      )
      return roles.map((role) => ({
        id: role.id as string,
        code: role.code as string,
        name: role.name as string,
        description: role.description as string,
        permissions: role.permissions ? String(role.permissions).split(',') : [],
      }))
    } finally {
      connection.release()
    }
  })
}

export async function listRegionals() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const [rows] = await connection.query<RowDataPacket[]>('SELECT id, name, code, status FROM regionals ORDER BY name ASC')
      return rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        code: row.code as string,
        status: row.status as string,
      }))
    } finally {
      connection.release()
    }
  })
}

export async function createRegionalAdmin(
  request: NextRequest,
  payload: { fullName: string; email: string; password?: string; regionalId: string },
) {
  const actor = await requireSuperAdmin(request)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const fullName = payload.fullName.trim()
      const email = payload.email.trim().toLowerCase()
      if (!fullName || !email || !payload.regionalId) throw new Error('Nama, email, dan regional wajib diisi')

      const [roleRows] = await connection.query<RowDataPacket[]>('SELECT id FROM roles WHERE code = :code LIMIT 1', { code: AUTH_ROLES.regionalAdmin })
      const roleId = roleRows[0]?.id as string | undefined
      if (!roleId) throw new Error('Role Admin Regional belum tersedia')

      const userId = randomUUID()
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO users (id, full_name, email, password_hash, status, email_verified_at)
          VALUES (:userId, :fullName, :email, :passwordHash, 'active', NULL)
        `,
        {
          userId,
          fullName,
          email,
          passwordHash: hashPassword(payload.password || randomBytes(12).toString('hex')),
        },
      )
      await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)', { userId, roleId })
      await connection.query('INSERT INTO admin_regional_access (user_id, regional_id) VALUES (:userId, :regionalId)', {
        userId,
        regionalId: payload.regionalId,
      })
      await writeActivityLog(connection, {
        userId: actor.userId,
        action: 'admin_regional.created',
        entityType: 'user',
        entityId: userId,
        metadata: { email, regionalId: payload.regionalId },
        request,
      })
      return { id: userId }
    } finally {
      connection.release()
    }
  })
}

export async function updateRegionalAdmin(request: NextRequest, userId: string, payload: { fullName?: string; regionalId?: string; status?: string }) {
  const actor = await requireSuperAdmin(request)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const fullName = payload.fullName?.trim()
      const regionalId = payload.regionalId?.trim()
      const status = payload.status?.trim()
      const allowedStatuses = new Set(['active', 'suspended', 'inactive'])

      const [adminRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT u.id
          FROM users u
          JOIN user_roles ur ON ur.user_id = u.id
          JOIN roles r ON r.id = ur.role_id
          WHERE u.id = :userId AND r.code = :roleCode
          LIMIT 1
        `,
        { userId, roleCode: AUTH_ROLES.regionalAdmin },
      )
      if (!adminRows[0]) throw new Error('Admin regional tidak ditemukan')

      if (fullName) {
        await connection.query('UPDATE users SET full_name = :fullName WHERE id = :userId', { fullName, userId })
      }
      if (status) {
        if (!allowedStatuses.has(status)) throw new Error('Status admin tidak valid')
        await connection.query('UPDATE users SET status = :status WHERE id = :userId', { status, userId })
      }
      if (regionalId) {
        const [regionalRows] = await connection.query<RowDataPacket[]>('SELECT id FROM regionals WHERE id = :regionalId LIMIT 1', { regionalId })
        if (!regionalRows[0]) throw new Error('Regional tidak ditemukan')
        await connection.query(
          `
            INSERT INTO admin_regional_access (user_id, regional_id)
            VALUES (:userId, :regionalId)
            ON DUPLICATE KEY UPDATE regional_id = VALUES(regional_id)
          `,
          {
            userId,
            regionalId,
          },
        )
        await connection.query('DELETE FROM admin_regional_access WHERE user_id = :userId AND regional_id <> :regionalId', {
          userId,
          regionalId,
        })
      }
      await writeActivityLog(connection, {
        userId: actor.userId,
        action: 'admin_regional.updated',
        entityType: 'user',
        entityId: userId,
        metadata: payload,
        request,
      })

      const [updatedRows] = await connection.query<AdminRow[]>(
        `
          SELECT
            u.id,
            u.full_name,
            u.email,
            u.status,
            u.last_login_at,
            ara.regional_id,
            rg.name AS regional_name,
            COUNT(DISTINCT s.id) AS active_sessions,
            GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permissions
          FROM users u
          JOIN user_roles ur ON ur.user_id = u.id
          JOIN roles r ON r.id = ur.role_id
          LEFT JOIN admin_regional_access ara ON ara.user_id = u.id
          LEFT JOIN regionals rg ON rg.id = ara.regional_id
          LEFT JOIN admin_sessions s ON s.user_id = u.id AND s.revoked_at IS NULL AND s.expires_at > NOW()
          LEFT JOIN role_permissions rp ON rp.role_id = r.id
          LEFT JOIN permissions p ON p.id = rp.permission_id
          WHERE u.id = :userId AND r.code = :roleCode
          GROUP BY u.id, u.full_name, u.email, u.status, u.last_login_at, ara.regional_id, rg.name
          LIMIT 1
        `,
        { userId, roleCode: AUTH_ROLES.regionalAdmin },
      )
      const updated = updatedRows[0]
      return {
        id: updated.id,
        fullName: updated.full_name,
        email: updated.email,
        status: updated.status,
        lastLoginAt: updated.last_login_at instanceof Date ? updated.last_login_at.toISOString() : updated.last_login_at,
        regionalId: updated.regional_id,
        regionalName: updated.regional_name,
        activeSessions: Number(updated.active_sessions || 0),
        permissions: updated.permissions ? updated.permissions.split(',') : [],
        totalPeserta: 0,
      }
    } finally {
      connection.release()
    }
  })
}

export async function resetRegionalAdminPassword(request: NextRequest, userId: string) {
  const actor = await requireSuperAdmin(request)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const resetToken = randomBytes(24).toString('hex')
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
          VALUES (:id, :userId, :tokenHash, DATE_ADD(NOW(), INTERVAL 1 DAY))
        `,
        { id: randomUUID(), userId, tokenHash: hashPassword(resetToken) },
      )
      await writeActivityLog(connection, {
        userId: actor.userId,
        action: 'admin_regional.password_reset_requested',
        entityType: 'user',
        entityId: userId,
        request,
      })
      return { resetToken }
    } finally {
      connection.release()
    }
  })
}

export async function forceLogoutAdmin(request: NextRequest, userId: string) {
  const actor = await requireSuperAdmin(request)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      await connection.query('UPDATE admin_sessions SET revoked_at = NOW() WHERE user_id = :userId AND revoked_at IS NULL', { userId })
      await writeActivityLog(connection, {
        userId: actor.userId,
        action: 'admin_regional.force_logout',
        entityType: 'user',
        entityId: userId,
        request,
      })
      return { id: userId }
    } finally {
      connection.release()
    }
  })
}

export async function getAdminActivity(userId: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const [rows] = await connection.query<RowDataPacket[]>(
        `
          SELECT action, entity_type, entity_id, metadata, created_at
          FROM admin_activity_logs
          WHERE user_id = :userId
          ORDER BY created_at DESC
          LIMIT 50
        `,
        { userId },
      )
      return rows.map((row) => ({
        action: row.action as string,
        entityType: row.entity_type as string | null,
        entityId: row.entity_id as string | null,
        metadata: row.metadata,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      }))
    } finally {
      connection.release()
    }
  })
}

export async function updateRolePermissions(request: NextRequest, roleId: string, permissions: string[]) {
  const actor = await requireSuperAdmin(request)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureRbacSchema(connection)
      const [roles] = await connection.query<RowDataPacket[]>('SELECT code FROM roles WHERE id = :roleId LIMIT 1', { roleId })
      if (!roles[0]) throw new Error('Role tidak ditemukan')
      if (roles[0].code === AUTH_ROLES.superAdmin && !permissions.includes('*')) {
        throw new Error('Super Admin harus memiliki permission *')
      }
      await assignPermissions(connection, roleId, permissions)
      await writeActivityLog(connection, {
        userId: actor.userId,
        action: 'role.permissions_updated',
        entityType: 'role',
        entityId: roleId,
        metadata: { permissions },
        request,
      })
      return { id: roleId, permissions }
    } finally {
      connection.release()
    }
  })
}
