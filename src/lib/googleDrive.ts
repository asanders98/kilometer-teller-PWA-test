import type { BackupData } from '../types'

const BACKUP_FILENAME = 'km-teller-backup.json'
const FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'

interface DriveFile {
  id: string
  name: string
  modifiedTime: string
}

interface DriveFileList {
  files: DriveFile[]
}

async function findBackupFile(token: string): Promise<DriveFile | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name='${BACKUP_FILENAME}'`,
    fields: 'files(id,name,modifiedTime)',
  })
  const res = await fetch(`${FILES_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    throw new Error(`Drive API error: ${res.status}`)
  }
  const data: DriveFileList = await res.json()
  return data.files.length > 0 ? data.files[0] : null
}

export async function uploadBackup(data: BackupData, token: string): Promise<void> {
  const existing = await findBackupFile(token)
  const body = JSON.stringify(data)

  if (existing) {
    // Update existing file
    const res = await fetch(`${UPLOAD_URL}/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('TOKEN_EXPIRED')
      throw new Error(`Drive upload error: ${res.status}`)
    }
  } else {
    // Create new file with multipart upload
    const metadata = {
      name: BACKUP_FILENAME,
      parents: ['appDataFolder'],
    }
    const boundary = '---km_teller_boundary'
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${body}\r\n` +
      `--${boundary}--`

    const res = await fetch(`${UPLOAD_URL}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('TOKEN_EXPIRED')
      throw new Error(`Drive create error: ${res.status}`)
    }
  }
}

export async function downloadBackup(token: string): Promise<BackupData | null> {
  const file = await findBackupFile(token)
  if (!file) return null

  const res = await fetch(`${FILES_URL}/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    throw new Error(`Drive download error: ${res.status}`)
  }
  return res.json()
}

export async function getBackupMetadata(token: string): Promise<{ modifiedTime: string } | null> {
  const file = await findBackupFile(token)
  if (!file) return null
  return { modifiedTime: file.modifiedTime }
}
