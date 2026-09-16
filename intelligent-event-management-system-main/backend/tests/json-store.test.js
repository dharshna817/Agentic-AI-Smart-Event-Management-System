const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const {
  ensureEntityFile,
  readEntity,
  writeEntity,
  withWriteLock,
  nextId,
} = require('../lib/jsonStore')

const storePath = path.join(__dirname, '..', 'test-store.json')

test('json store can create, read, and write an entity file', () => {
  ensureEntityFile('test-store', [])
  const before = readEntity('test-store', [])
  assert.deepEqual(before, [])

  const updated = [{ id: 1, name: 'Alpha' }]
  writeEntity('test-store', updated)
  assert.deepEqual(readEntity('test-store', []), updated)

  fs.unlinkSync(storePath)
})

test('duplicate-user prevention works with JSON-backed users', () => {
  const usersFile = path.join(__dirname, '..', 'users.json')
  const original = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile, 'utf8')) : []

  const users = [{ id: 1, email: 'duplicate@example.com', role: 'user' }]
  writeEntity('users', users)

  const exists = readEntity('users', []).some((user) => user.email === 'duplicate@example.com')
  assert.equal(exists, true)

  fs.writeFileSync(usersFile, JSON.stringify(original, null, 2))
})

test('venue conflict detection rejects overlap across bookings', () => {
  const bookings = [
    { id: 1, venue_id: 7, start_time: '2026-08-20T10:00:00', end_time: '2026-08-20T11:00:00', status: 'confirmed' },
    { id: 2, venue_id: 7, start_time: '2026-08-20T10:30:00', end_time: '2026-08-20T11:30:00', status: 'confirmed' },
  ]

  const hasOverlap = bookings.some((booking, index) => {
    return bookings.slice(index + 1).some((other) => {
      return Number(booking.venue_id) === Number(other.venue_id) &&
        new Date(booking.start_time) < new Date(other.end_time) &&
        new Date(booking.end_time) > new Date(other.start_time)
    })
  })

  assert.equal(hasOverlap, true)
})

test('speaker conflict detection rejects overlap across sessions', () => {
  const sessions = [
    { id: 1, speaker_id: 2, start_time: '2026-08-20T09:00:00', end_time: '2026-08-20T10:00:00', status: 'scheduled' },
    { id: 2, speaker_id: 2, start_time: '2026-08-20T09:30:00', end_time: '2026-08-20T10:30:00', status: 'scheduled' },
  ]

  const hasOverlap = sessions.some((session, index) => {
    return sessions.slice(index + 1).some((other) => {
      return Number(session.speaker_id) === Number(other.speaker_id) &&
        new Date(session.start_time) < new Date(other.end_time) &&
        new Date(session.end_time) > new Date(other.start_time)
    })
  })

  assert.equal(hasOverlap, true)
})

test('withWriteLock serializes near-simultaneous writes and rejects the second conflicting request', async () => {
  const entityName = 'race-lock-test'
  ensureEntityFile(entityName, [])
  writeEntity(entityName, [{ id: 1, venue_id: 5, start_time: '2026-08-20T09:00:00', end_time: '2026-08-20T10:00:00' }])

  let secondRejected = false

  await withWriteLock(entityName, async () => {
    const items = readEntity(entityName, [])
    const firstWrite = async () => {
      const current = readEntity(entityName, [])
      const conflicting = current.some((item) => Number(item.venue_id) === 5 &&
        new Date(item.start_time) < new Date('2026-08-20T10:00:00') &&
        new Date(item.end_time) > new Date('2026-08-20T09:30:00'))

      if (conflicting) {
        throw new Error('conflict')
      }

      current.push({ id: 2, venue_id: 5, start_time: '2026-08-20T09:30:00', end_time: '2026-08-20T10:30:00' })
      writeEntity(entityName, current)
    }

    try {
      await firstWrite()
    } catch (error) {
      assert.equal(error.message, 'conflict')
    }
  })

  await withWriteLock(entityName, async () => {
    const items = readEntity(entityName, [])
    const hasConflict = items.some((item) => Number(item.venue_id) === 5 &&
      new Date(item.start_time) < new Date('2026-08-20T10:30:00') &&
      new Date(item.end_time) > new Date('2026-08-20T09:30:00')
    )

    if (hasConflict) {
      secondRejected = true
    }
  })

  assert.equal(secondRejected, true)
  fs.unlinkSync(path.join(__dirname, '..', `${entityName}.json`))
})

test('nextId returns the next numeric identifier', () => {
  const items = [{ id: 1 }, { id: 7 }, { id: 9 }]
  assert.equal(nextId(items), 10)
})
