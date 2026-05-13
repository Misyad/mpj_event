import { randomUUID } from 'crypto'
import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { withDb } from '@/lib/server/db'
import type { Speaker, SpeakerCategory } from '@/types'

const SPEAKER_CATEGORIES: SpeakerCategory[] = ['Tech', 'Bisnis', 'Desain', 'Jurnalistik', 'Keagamaan', 'Lainnya']
const DEFAULT_SPEAKER_PHOTO = '/mpj-logo.jpeg'

type SpeakerRow = RowDataPacket & {
  id: string
  nama_lengkap: string
  alamat: string | null
  keahlian: string | string[] | null
  no_telp: string | null
  portfolio_url: string | null
  kategori: SpeakerCategory | null
  foto_path: string | null
  bio: string | null
}

export type SpeakerPayload = {
  nama_lengkap?: string
  alamat?: string | null
  keahlian?: string[]
  no_telp?: string | null
  portfolio_url?: string | null
  kategori?: SpeakerCategory | null
  foto_url?: string | null
  foto_path?: string | null
  bio?: string | null
}

async function ensureSpeakerSchema(connection: PoolConnection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS speakers (
      id CHAR(36) NOT NULL DEFAULT (UUID()),
      nama_lengkap VARCHAR(255) NOT NULL,
      alamat TEXT NULL,
      keahlian JSON NOT NULL DEFAULT (JSON_ARRAY()),
      no_telp VARCHAR(20) NULL,
      portfolio_url VARCHAR(500) NULL,
      kategori ENUM('Tech','Bisnis','Desain','Jurnalistik','Keagamaan','Lainnya') NOT NULL DEFAULT 'Lainnya',
      foto_path VARCHAR(500) NULL,
      bio TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `)
}

function parseSkills(value: SpeakerRow['keahlian']): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []
  } catch {
    return []
  }
}

function normalizeCategory(value: unknown): SpeakerCategory {
  return SPEAKER_CATEGORIES.includes(value as SpeakerCategory) ? (value as SpeakerCategory) : 'Lainnya'
}

function normalizeSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)))
}

function mapSpeaker(row: SpeakerRow): Speaker {
  return {
    id: row.id,
    nama_lengkap: row.nama_lengkap,
    alamat: row.alamat ?? '',
    keahlian: parseSkills(row.keahlian),
    no_telp: row.no_telp ?? '',
    portfolio_url: row.portfolio_url ?? '',
    kategori: normalizeCategory(row.kategori),
    foto_url: row.foto_path || DEFAULT_SPEAKER_PHOTO,
    bio: row.bio ?? '',
  }
}

export async function getSpeakersFromDb() {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureSpeakerSchema(connection)
      const [rows] = await connection.query<SpeakerRow[]>('SELECT * FROM speakers ORDER BY nama_lengkap ASC')
      return rows.map(mapSpeaker)
    } finally {
      connection.release()
    }
  })
}

export async function getSpeakerFromDb(id: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureSpeakerSchema(connection)
      const [rows] = await connection.query<SpeakerRow[]>('SELECT * FROM speakers WHERE id = :id LIMIT 1', { id })
      return rows[0] ? mapSpeaker(rows[0]) : null
    } finally {
      connection.release()
    }
  })
}

export async function createSpeakerInDb(payload: SpeakerPayload) {
  const fullName = String(payload.nama_lengkap ?? '').trim()
  if (!fullName) throw new Error('Nama lengkap narasumber wajib diisi')

  const speaker = {
    id: randomUUID(),
    nama_lengkap: fullName,
    alamat: String(payload.alamat ?? '').trim() || null,
    keahlian: normalizeSkills(payload.keahlian),
    no_telp: String(payload.no_telp ?? '').trim() || null,
    portfolio_url: String(payload.portfolio_url ?? '').trim() || null,
    kategori: normalizeCategory(payload.kategori),
    foto_path: String(payload.foto_url ?? payload.foto_path ?? '').trim() || null,
    bio: String(payload.bio ?? '').trim() || null,
  }

  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureSpeakerSchema(connection)
      await connection.query(
        `
          INSERT INTO speakers (
            id, nama_lengkap, alamat, keahlian, no_telp, portfolio_url, kategori, foto_path, bio
          )
          VALUES (
            :id, :nama_lengkap, :alamat, CAST(:keahlian AS JSON), :no_telp, :portfolio_url, :kategori, :foto_path, :bio
          )
        `,
        { ...speaker, keahlian: JSON.stringify(speaker.keahlian) },
      )
      const created = await getSpeakerFromDb(speaker.id)
      if (!created) throw new Error('Gagal membuat narasumber')
      return created
    } finally {
      connection.release()
    }
  })
}

export async function updateSpeakerInDb(id: string, payload: SpeakerPayload) {
  const existing = await getSpeakerFromDb(id)
  if (!existing) return null

  const next = {
    nama_lengkap: String(payload.nama_lengkap ?? existing.nama_lengkap).trim(),
    alamat: String(payload.alamat ?? existing.alamat ?? '').trim() || null,
    keahlian: Array.isArray(payload.keahlian) ? normalizeSkills(payload.keahlian) : existing.keahlian,
    no_telp: String(payload.no_telp ?? existing.no_telp ?? '').trim() || null,
    portfolio_url: String(payload.portfolio_url ?? existing.portfolio_url ?? '').trim() || null,
    kategori: normalizeCategory(payload.kategori ?? existing.kategori),
    foto_path: String(payload.foto_url ?? payload.foto_path ?? existing.foto_url ?? '').trim() || null,
    bio: String(payload.bio ?? existing.bio ?? '').trim() || null,
  }
  if (!next.nama_lengkap) throw new Error('Nama lengkap narasumber wajib diisi')

  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureSpeakerSchema(connection)
      await connection.query(
        `
          UPDATE speakers
          SET nama_lengkap = :nama_lengkap,
              alamat = :alamat,
              keahlian = CAST(:keahlian AS JSON),
              no_telp = :no_telp,
              portfolio_url = :portfolio_url,
              kategori = :kategori,
              foto_path = :foto_path,
              bio = :bio
          WHERE id = :id
        `,
        { id, ...next, keahlian: JSON.stringify(next.keahlian) },
      )
      return getSpeakerFromDb(id)
    } finally {
      connection.release()
    }
  })
}

export async function deleteSpeakerFromDb(id: string) {
  return withDb(async (db) => {
    const connection = await db.getConnection()
    try {
      await ensureSpeakerSchema(connection)
      await connection.query('DELETE FROM speakers WHERE id = :id', { id })
    } finally {
      connection.release()
    }
  })
}
