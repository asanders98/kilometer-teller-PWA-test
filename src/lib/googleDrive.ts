import type { BackupData } from '../types'

const isTest = import.meta.env.BASE_URL.includes('test')
const BACKUP_FILENAME = isTest ? 'km-teller-backup-test.json' : 'km-teller-backup.json'
const FOLDER_NAME = 'Kilometer Teller'
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

async function findOrCreateFolder(token: string): Promise<string> {
  // Search for existing folder
  const params = new URLSearchParams({
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  })
  const res = await fetch(`${FILES_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('TOKEN_EXPIRED')
    throw new Error(`Drive API error: ${res.status}`)
  }
  const data: DriveFileList = await res.json()
  if (data.files.length > 0) return data.files[0].id

  // Create folder
  const createRes = await fetch(FILES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })
  if (!createRes.ok) {
    if (createRes.status === 401) throw new Error('TOKEN_EXPIRED')
    throw new Error(`Drive folder create error: ${createRes.status}`)
  }
  const folder = await createRes.json()
  return folder.id
}

async function findBackupFile(token: string, folderId: string): Promise<DriveFile | null> {
  const params = new URLSearchParams({
    q: `name='${BACKUP_FILENAME}' and '${folderId}' in parents and trashed=false`,
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
  const folderId = await findOrCreateFolder(token)
  const existing = await findBackupFile(token, folderId)
  const body = JSON.stringify(data)

  if (existing) {
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
    const metadata = {
      name: BACKUP_FILENAME,
      parents: [folderId],
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
  const folderId = await findOrCreateFolder(token)
  const file = await findBackupFile(token, folderId)
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
  const folderId = await findOrCreateFolder(token)
  const file = await findBackupFile(token, folderId)
  if (!file) return null
  return { modifiedTime: file.modifiedTime }
}
