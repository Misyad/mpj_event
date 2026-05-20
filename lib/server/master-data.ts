import { randomUUID } from 'crypto'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { withDb } from '@/lib/server/db'
import { AUTH_ROLES, type AuthRole } from '@/lib/auth/roles'
import type { CrewMember, MediaUnit, Pesantren } from '@/types'

type MasterStatus = 'Aktif' | 'Non-Aktif'
type MasterScope = 'pusat' | 'regional'

export type MasterDataActor = {
  role: AuthRole
  regionalId?: string | null
}

type PesantrenRow = RowDataPacket & {
  id: string
  name: string
  founder: string | null
  region: string | null
  scope: MasterScope | string | null
  region_id: string | null
  kabupaten: string | null
  total_santri: number | null
  status: MasterStatus | string | null
}

type MediaRow = RowDataPacket & {
  id: string
  name: string
  type: string | null
  region: string | null
  scope: MasterScope | string | null
  region_id: string | null
  pic: string | null
  status: MasterStatus | string | null
}

type CrewRow = RowDataPacket & {
  id: string
  niam: string
  full_name: string
  unit: string | null
  scope: MasterScope | string | null
  region_id: string | null
  role: string | null
  pesantren: string | null
  joined_at: Date | string | null
}

type PesantrenPayload = Partial<Omit<Pesantren, 'id'>>
type MediaPayload = Partial<Omit<MediaUnit, 'id'>>
type CrewPayload = Partial<Omit<CrewMember, 'id'>>

function getString(value: unknown) {
  return String(value ?? '').trim()
}

function getStatus(value: unknown, fallback: MasterStatus = 'Aktif'): MasterStatus {
  const status = getString(value || fallback)
  return status === 'Non-Aktif' ? 'Non-Aktif' : 'Aktif'
}

function getScope(value: unknown, fallback: MasterScope = 'pusat'): MasterScope {
  return getString(value || fallback) === 'regional' ? 'regional' : 'pusat'
}

function canManageAll(actor?: MasterDataActor) {
  return !actor || actor.role === AUTH_ROLES.superAdmin
}

function buildReadableScopeWhere(actor?: MasterDataActor) {
  if (canManageAll(actor)) return { sql: '', params: {} }
  if (!actor?.regionalId) throw new Error('Admin Regional tidak memiliki regional_id')
  return {
    sql: "WHERE scope = 'pusat' OR region_id = :regionalId",
    params: { regionalId: actor.regionalId },
  }
}

function getWritableScope(
  actor?: MasterDataActor,
  payload?: { scope?: unknown; regionId?: unknown; region_id?: unknown },
  fallback?: { scope?: unknown; region_id?: unknown },
) {
  if (!actor || actor.role === AUTH_ROLES.superAdmin) {
    const scope = getScope(payload?.scope ?? fallback?.scope)
    const regionId = scope === 'regional' ? getString(payload?.regionId ?? payload?.region_id ?? fallback?.region_id) || null : null
    return { scope, regionId }
  }
  if (!actor.regionalId) throw new Error('Admin Regional tidak memiliki regional_id')
  return { scope: 'regional' as MasterScope, regionId: actor.regionalId }
}

function assertWritableRow(row: { scope?: string | null; region_id?: string | null }, actor?: MasterDataActor) {
  if (canManageAll(actor)) return
  if (!actor?.regionalId) throw new Error('Admin Regional tidak memiliki regional_id')
  if (row.scope !== 'regional' || row.region_id !== actor.regionalId) {
    throw new Error('Forbidden')
  }
}

function getDate(value: unknown) {
  const raw = getString(value)
  if (!raw) return new Date().toISOString().slice(0, 10)
  return raw.slice(0, 10)
}

function toDateString(value: Date | string | null) {
  if (!value) return new Date().toISOString().slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
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

async function ensureIndex(connection: PoolConnection, tableName: string, indexName: string, definition: string) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = :tableName
        AND INDEX_NAME = :indexName
    `,
    { tableName, indexName },
  )

  if (Number(rows[0]?.total || 0) === 0) {
    await connection.query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} ${definition}`)
  }
}

export async function ensureMasterDataSchema(connection: PoolConnection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS master_pesantren (
      id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      founder VARCHAR(255) NULL,
      region VARCHAR(255) NULL,
      kabupaten VARCHAR(255) NULL,
      total_santri INT NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'Aktif',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `)
  await ensureIndex(connection, 'master_pesantren', 'master_pesantren_name_idx', '(name)')
  await ensureColumn(connection, 'master_pesantren', 'scope', "VARCHAR(20) NOT NULL DEFAULT 'pusat'")
  await ensureColumn(connection, 'master_pesantren', 'region_id', 'VARCHAR(36) NULL')
  await ensureIndex(connection, 'master_pesantren', 'master_pesantren_region_idx', '(region)')
  await ensureIndex(connection, 'master_pesantren', 'master_pesantren_region_id_idx', '(region_id)')

  await connection.query(`
    CREATE TABLE IF NOT EXISTS master_media_units (
      id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(120) NULL,
      region VARCHAR(255) NULL,
      pic VARCHAR(255) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Aktif',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `)
  await ensureIndex(connection, 'master_media_units', 'master_media_units_name_idx', '(name)')
  await ensureColumn(connection, 'master_media_units', 'scope', "VARCHAR(20) NOT NULL DEFAULT 'pusat'")
  await ensureColumn(connection, 'master_media_units', 'region_id', 'VARCHAR(36) NULL')
  await ensureIndex(connection, 'master_media_units', 'master_media_units_region_idx', '(region)')
  await ensureIndex(connection, 'master_media_units', 'master_media_units_region_id_idx', '(region_id)')

  await connection.query(`
    CREATE TABLE IF NOT EXISTS crew_members (
      id VARCHAR(36) NOT NULL,
      niam VARCHAR(50) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      unit VARCHAR(255) NULL,
      photo_path VARCHAR(500) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY crew_members_niam_unique (niam)
    )
  `)
  await ensureColumn(connection, 'crew_members', 'role', 'VARCHAR(120) NULL')
  await ensureColumn(connection, 'crew_members', 'pesantren', 'VARCHAR(255) NULL')
  await ensureColumn(connection, 'crew_members', 'scope', "VARCHAR(20) NOT NULL DEFAULT 'pusat'")
  await ensureColumn(connection, 'crew_members', 'region_id', 'VARCHAR(36) NULL')
  await ensureColumn(connection, 'crew_members', 'joined_at', 'DATE NULL')
  await ensureColumn(connection, 'crew_members', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
  await ensureIndex(connection, 'crew_members', 'crew_members_full_name_idx', '(full_name)')
  await ensureIndex(connection, 'crew_members', 'crew_members_unit_idx', '(unit)')
  await ensureIndex(connection, 'crew_members', 'crew_members_region_id_idx', '(region_id)')
}

function mapPesantren(row: PesantrenRow): Pesantren {
  return {
    id: row.id,
    name: row.name,
    founder: row.founder ?? '',
    region: row.region ?? '',
    scope: getScope(row.scope),
    regionId: row.region_id ?? null,
    kabupaten: row.kabupaten ?? '',
    total_santri: Number(row.total_santri ?? 0),
    status: getStatus(row.status),
  }
}

function mapMedia(row: MediaRow): MediaUnit {
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? '',
    region: row.region ?? '',
    scope: getScope(row.scope),
    regionId: row.region_id ?? null,
    pic: row.pic ?? '',
    status: getStatus(row.status),
  }
}

function mapCrew(row: CrewRow): CrewMember {
  return {
    id: row.id,
    niam: row.niam,
    full_name: row.full_name,
    unit: row.unit ?? '',
    scope: getScope(row.scope),
    regionId: row.region_id ?? null,
    role: row.role ?? '',
    pesantren: row.pesantren ?? '',
    joined_at: toDateString(row.joined_at),
  }
}

export async function listMasterPesantren(actor?: MasterDataActor) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const scopeWhere = buildReadableScopeWhere(actor)
      const [rows] = await connection.query<PesantrenRow[]>(
        `SELECT * FROM master_pesantren ${scopeWhere.sql} ORDER BY name ASC`,
        scopeWhere.params,
      )
      return rows.map(mapPesantren)
    } finally {
      connection.release()
    }
  })
}

export async function createMasterPesantren(payload: PesantrenPayload, actor?: MasterDataActor) {
  const data = normalizePesantrenPayload(payload)
  const scope = getWritableScope(actor, payload)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const id = randomUUID()
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO master_pesantren (id, name, founder, region, scope, region_id, kabupaten, total_santri, status)
          VALUES (:id, :name, :founder, :region, :scope, :regionId, :kabupaten, :totalSantri, :status)
        `,
        { id, ...data, ...scope },
      )
      return { id, name: data.name, founder: data.founder ?? '', region: data.region ?? '', scope: scope.scope, regionId: scope.regionId, kabupaten: data.kabupaten ?? '', total_santri: data.totalSantri, status: data.status }
    } finally {
      connection.release()
    }
  })
}

export async function updateMasterPesantren(id: string, payload: PesantrenPayload, actor?: MasterDataActor) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const [rows] = await connection.query<PesantrenRow[]>('SELECT * FROM master_pesantren WHERE id = :id LIMIT 1', { id })
      const existing = rows[0]
      if (!existing) return null
      assertWritableRow(existing, actor)
      const data = normalizePesantrenPayload(payload, mapPesantren(existing))
      const scope = getWritableScope(actor, payload, existing)
      await connection.query<ResultSetHeader>(
        `
          UPDATE master_pesantren
          SET name = :name, founder = :founder, region = :region, scope = :scope, region_id = :regionId, kabupaten = :kabupaten, total_santri = :totalSantri, status = :status
          WHERE id = :id
        `,
        { id, ...data, ...scope },
      )
      return { id, name: data.name, founder: data.founder ?? '', region: data.region ?? '', scope: scope.scope, regionId: scope.regionId, kabupaten: data.kabupaten ?? '', total_santri: data.totalSantri, status: data.status }
    } finally {
      connection.release()
    }
  })
}

function normalizePesantrenPayload(payload: PesantrenPayload, fallback?: Pesantren) {
  const name = getString(payload.name ?? fallback?.name)
  if (!name) throw new Error('Nama pesantren wajib diisi')
  return {
    name,
    founder: getString(payload.founder ?? fallback?.founder) || null,
    region: getString(payload.region ?? fallback?.region) || null,
    kabupaten: getString(payload.kabupaten ?? fallback?.kabupaten) || null,
    totalSantri: Math.max(0, Number(payload.total_santri ?? fallback?.total_santri ?? 0) || 0),
    status: getStatus(payload.status ?? fallback?.status),
  }
}

export async function listMasterMedia(actor?: MasterDataActor) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const scopeWhere = buildReadableScopeWhere(actor)
      const [rows] = await connection.query<MediaRow[]>(
        `SELECT * FROM master_media_units ${scopeWhere.sql} ORDER BY name ASC`,
        scopeWhere.params,
      )
      return rows.map(mapMedia)
    } finally {
      connection.release()
    }
  })
}

export async function createMasterMedia(payload: MediaPayload, actor?: MasterDataActor) {
  const data = normalizeMediaPayload(payload)
  const scope = getWritableScope(actor, payload)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const id = randomUUID()
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO master_media_units (id, name, type, region, scope, region_id, pic, status)
          VALUES (:id, :name, :type, :region, :scope, :regionId, :pic, :status)
        `,
        { id, ...data, ...scope },
      )
      return { id, name: data.name, type: data.type ?? '', region: data.region ?? '', scope: scope.scope, regionId: scope.regionId, pic: data.pic ?? '', status: data.status }
    } finally {
      connection.release()
    }
  })
}

export async function updateMasterMedia(id: string, payload: MediaPayload, actor?: MasterDataActor) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const [rows] = await connection.query<MediaRow[]>('SELECT * FROM master_media_units WHERE id = :id LIMIT 1', { id })
      const existing = rows[0]
      if (!existing) return null
      assertWritableRow(existing, actor)
      const data = normalizeMediaPayload(payload, mapMedia(existing))
      const scope = getWritableScope(actor, payload, existing)
      await connection.query<ResultSetHeader>(
        `
          UPDATE master_media_units
          SET name = :name, type = :type, region = :region, scope = :scope, region_id = :regionId, pic = :pic, status = :status
          WHERE id = :id
        `,
        { id, ...data, ...scope },
      )
      return { id, name: data.name, type: data.type ?? '', region: data.region ?? '', scope: scope.scope, regionId: scope.regionId, pic: data.pic ?? '', status: data.status }
    } finally {
      connection.release()
    }
  })
}

function normalizeMediaPayload(payload: MediaPayload, fallback?: MediaUnit) {
  const name = getString(payload.name ?? fallback?.name)
  if (!name) throw new Error('Nama media wajib diisi')
  return {
    name,
    type: getString(payload.type ?? fallback?.type) || null,
    region: getString(payload.region ?? fallback?.region) || null,
    pic: getString(payload.pic ?? fallback?.pic) || null,
    status: getStatus(payload.status ?? fallback?.status),
  }
}

export async function listMasterCrew(actor?: MasterDataActor) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const scopeWhere = buildReadableScopeWhere(actor)
      const [rows] = await connection.query<CrewRow[]>(
        `SELECT id, niam, full_name, unit, scope, region_id, role, pesantren, joined_at FROM crew_members ${scopeWhere.sql} ORDER BY full_name ASC`,
        scopeWhere.params,
      )
      return rows.map(mapCrew)
    } finally {
      connection.release()
    }
  })
}

export async function createMasterCrew(payload: CrewPayload, actor?: MasterDataActor) {
  const data = normalizeCrewPayload(payload)
  const scope = getWritableScope(actor, payload)
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const id = randomUUID()
      await connection.query<ResultSetHeader>(
        `
          INSERT INTO crew_members (id, niam, full_name, unit, scope, region_id, role, pesantren, joined_at)
          VALUES (:id, :niam, :fullName, :unit, :scope, :regionId, :role, :pesantren, :joinedAt)
        `,
        { id, ...data, ...scope },
      )
      return { id, niam: data.niam, full_name: data.fullName, unit: data.unit ?? '', scope: scope.scope, regionId: scope.regionId, role: data.role ?? '', pesantren: data.pesantren ?? '', joined_at: data.joinedAt }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('Duplicate')) throw new Error('NIAM sudah digunakan')
      throw error
    } finally {
      connection.release()
    }
  })
}

export async function updateMasterCrew(id: string, payload: CrewPayload, actor?: MasterDataActor) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureMasterDataSchema(connection)
      const [rows] = await connection.query<CrewRow[]>('SELECT id, niam, full_name, unit, scope, region_id, role, pesantren, joined_at FROM crew_members WHERE id = :id LIMIT 1', { id })
      const existing = rows[0]
      if (!existing) return null
      assertWritableRow(existing, actor)
      const data = normalizeCrewPayload(payload, mapCrew(existing))
      const scope = getWritableScope(actor, payload, existing)
      await connection.query<ResultSetHeader>(
        `
          UPDATE crew_members
          SET niam = :niam, full_name = :fullName, unit = :unit, scope = :scope, region_id = :regionId, role = :role, pesantren = :pesantren, joined_at = :joinedAt
          WHERE id = :id
        `,
        { id, ...data, ...scope },
      )
      return { id, niam: data.niam, full_name: data.fullName, unit: data.unit ?? '', scope: scope.scope, regionId: scope.regionId, role: data.role ?? '', pesantren: data.pesantren ?? '', joined_at: data.joinedAt }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('Duplicate')) throw new Error('NIAM sudah digunakan')
      throw error
    } finally {
      connection.release()
    }
  })
}

function normalizeCrewPayload(payload: CrewPayload, fallback?: CrewMember) {
  const fullName = getString(payload.full_name ?? fallback?.full_name)
  const niam = getString(payload.niam ?? fallback?.niam).toUpperCase()
  if (!fullName) throw new Error('Nama kru wajib diisi')
  if (!niam) throw new Error('NIAM wajib diisi')
  return {
    niam,
    fullName,
    unit: getString(payload.unit ?? fallback?.unit) || null,
    role: getString(payload.role ?? fallback?.role) || null,
    pesantren: getString(payload.pesantren ?? fallback?.pesantren) || null,
    joinedAt: getDate(payload.joined_at ?? fallback?.joined_at),
  }
}

export type MasterInstitutionOption = {
  id: string
  name: string
  subtitle?: string
  kind: 'pesantren' | 'media' | 'unit'
}

export async function listInstitutionOptions(): Promise<MasterInstitutionOption[]> {
  const [pesantren, media, crew] = await Promise.all([listMasterPesantren(), listMasterMedia(), listMasterCrew()])
  const options: MasterInstitutionOption[] = [
    ...pesantren.filter((item) => item.status === 'Aktif').map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: [item.region, item.kabupaten].filter(Boolean).join(' - '),
      kind: 'pesantren' as const,
    })),
    ...media.filter((item) => item.status === 'Aktif').map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: [item.type, item.region].filter(Boolean).join(' - '),
      kind: 'media' as const,
    })),
    ...crew.map((item) => ({
      id: `unit-${item.id}`,
      name: item.unit,
      subtitle: item.pesantren,
      kind: 'unit' as const,
    })).filter((item) => item.name),
    ...crew.map((item) => ({
      id: `crew-pesantren-${item.id}`,
      name: item.pesantren,
      subtitle: item.unit,
      kind: 'pesantren' as const,
    })).filter((item) => item.name),
  ]

  const seen = new Set<string>()
  return options
    .filter((option) => {
      const key = option.name.trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'id-ID'))
}
