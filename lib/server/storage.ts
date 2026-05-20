import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

export type StoredObject = {
  url: string
  key: string
}

export type StorageAdapter = {
  putObject(key: string, body: Buffer, contentType: string): Promise<StoredObject>
  readPublicObject(url: string): Promise<Buffer | null>
}

function sanitizeKey(key: string) {
  return key
    .replace(/\\/g, '/')
    .split('/')
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, '-'))
    .filter(Boolean)
    .join('/')
}

class LocalPublicStorageAdapter implements StorageAdapter {
  async putObject(key: string, body: Buffer, contentType: string): Promise<StoredObject> {
    void contentType
    const safeKey = sanitizeKey(key)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const targetPath = path.join(uploadDir, safeKey)
    const resolvedUploadDir = path.resolve(uploadDir)
    const resolvedTargetPath = path.resolve(targetPath)

    if (!resolvedTargetPath.startsWith(resolvedUploadDir)) {
      throw new Error('Path upload tidak valid')
    }

    await mkdir(path.dirname(resolvedTargetPath), { recursive: true })
    await writeFile(resolvedTargetPath, body)
    return { key: safeKey, url: `/uploads/${safeKey}` }
  }

  async readPublicObject(url: string): Promise<Buffer | null> {
    if (!url.startsWith('/uploads/')) return null
    const safeKey = sanitizeKey(url.replace(/^\/uploads\//, ''))
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const targetPath = path.join(uploadDir, safeKey)
    const resolvedUploadDir = path.resolve(uploadDir)
    const resolvedTargetPath = path.resolve(targetPath)

    if (!resolvedTargetPath.startsWith(resolvedUploadDir)) return null

    try {
      return await readFile(resolvedTargetPath)
    } catch {
      return null
    }
  }
}

export function getStorageAdapter(): StorageAdapter {
  return new LocalPublicStorageAdapter()
}

export function sanitizePublicUploadUrl(url: string | null | undefined) {
  if (!url) return null
  if (!url.startsWith('/uploads/')) return null
  if (url.includes('..') || url.includes('\\')) return null
  return url
}
