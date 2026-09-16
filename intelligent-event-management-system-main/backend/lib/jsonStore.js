const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..')
const writeLocks = new Map()

function acquireFileLock(lockFilePath) {
  const startedAt = Date.now()

  while (true) {
    try {
      return fs.openSync(lockFilePath, 'wx')
    } catch (error) {
      if (error && error.code !== 'EEXIST') {
        throw error
      }
      if (Date.now() - startedAt > 1000) {
        throw new Error(`Timed out waiting for entity lock: ${lockFilePath}`)
      }
    }
  }
}

function releaseFileLock(lockFilePath, descriptor) {
  try {
    if (descriptor) {
      fs.closeSync(descriptor)
    }
  } catch (error) {
    // Ignore release errors; the lock is best-effort for serialized writes.
  }

  try {
    if (fs.existsSync(lockFilePath)) {
      fs.unlinkSync(lockFilePath)
    }
  } catch (error) {
    // Ignore cleanup errors; the lock file may already have been removed.
  }
}

function ensureEntityFile(entityName, defaultValue = []) {
  const filePath = path.join(DATA_DIR, `${entityName}.json`)
  try {
    if (!fs.existsSync(filePath)) {
      const payload = Array.isArray(defaultValue) ? defaultValue : []
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
    }
    return filePath
  } catch (error) {
    console.error(`Failed to ensure entity file ${entityName}:`, error.message)
    return filePath
  }
}

function readEntity(entityName, fallback = []) {
  const filePath = ensureEntityFile(entityName, fallback)
  const lockFilePath = `${filePath}.lock`
  const descriptor = acquireFileLock(lockFilePath)
  try {
    if (!fs.existsSync(filePath)) return Array.isArray(fallback) ? fallback : []
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : (Array.isArray(fallback) ? fallback : [])
  } catch (error) {
    console.error(`Failed to read entity ${entityName}:`, error.message)
    return Array.isArray(fallback) ? fallback : []
  } finally {
    releaseFileLock(lockFilePath, descriptor)
  }
}

function writeEntity(entityName, data) {
  const filePath = ensureEntityFile(entityName, [])
  const payload = Array.isArray(data) ? data : []
  const lockFilePath = `${filePath}.lock`
  const descriptor = acquireFileLock(lockFilePath)
  try {
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
    return payload
  } catch (error) {
    console.error(`Failed to write entity ${entityName}:`, error.message)
    return payload
  } finally {
    releaseFileLock(lockFilePath, descriptor)
  }
}

function withWriteLock(entityName, fn) {
  const lockKey = entityName
  const current = writeLocks.get(lockKey) || Promise.resolve()

  let release
  const nextLock = new Promise((resolve) => {
    release = resolve
  })

  writeLocks.set(lockKey, current.then(() => nextLock))

  return current
    .then(() => fn())
    .finally(() => {
      release()
      if (writeLocks.get(lockKey) === nextLock) {
        writeLocks.delete(lockKey)
      }
    })
}

function nextId(items, idField = 'id') {
  if (!Array.isArray(items) || items.length === 0) return 1
  const maxValue = items.reduce((max, item) => {
    const rawValue = Number(item?.[idField])
    return Number.isFinite(rawValue) ? Math.max(max, rawValue) : max
  }, 0)
  return maxValue + 1
}

module.exports = {
  ensureEntityFile,
  readEntity,
  writeEntity,
  withWriteLock,
  nextId,
}
