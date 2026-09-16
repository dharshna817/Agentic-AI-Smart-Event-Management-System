const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const { readEntity, writeEntity, nextId } = require('../lib/jsonStore')
const { findSponsorRecordByEmail, getSponsorProposalsForAccount } = require('../routes/sponsor')

test('Sponsor json store persistence and field validation', () => {
    const sponsorsFile = path.join(__dirname, '..', 'sponsors.json')
    const original = fs.existsSync(sponsorsFile) ? JSON.parse(fs.readFileSync(sponsorsFile, 'utf8')) : []

    const testSponsor = {
        id: nextId(original),
        company_name: 'TechCorp Global',
        contact_person: 'Alex Smith',
        email: 'alex@techcorp.test',
        phone: '9876543210',
        industry: 'Technology',
        website: 'https://techcorp.test',
        password: 'salt:hash',
        role: 'sponsor',
        status: 'Active',
        active_sponsorships: 2,
        pending_proposals: 1,
        total_sponsorship_value: 800000,
        pending_payments: 200000,
    }

    const updatedList = [...original, testSponsor]
    writeEntity('sponsors', updatedList)

    const retrieved = readEntity('sponsors', [])
    const found = retrieved.find((s) => s.email === 'alex@techcorp.test')

    assert.ok(found)
    assert.equal(found.company_name, 'TechCorp Global')
    assert.equal(found.role, 'sponsor')
    assert.equal(found.status, 'Active')

    // Clean up
    writeEntity('sponsors', original)
})

test('Sponsor lookup falls back to sponsor users when sponsors.json has no matching email', () => {
    const originalSponsors = readEntity('sponsors', [])
    const originalUsers = readEntity('users', [])
    const email = 'user-sponsor@example.com'

    writeEntity('sponsors', [{ id: 99, company_name: 'Alpha Sponsor Co.', role: 'sponsor', status: 'Active' }])
    writeEntity('users', [
        ...originalUsers,
        {
            id: nextId(originalUsers),
            name: 'User Sponsor',
            company_name: 'User Sponsor Co.',
            email,
            phone: '9999999999',
            password: 'salt:hash',
            role: 'sponsor',
            created_at: new Date().toISOString(),
        },
    ])

    const sponsor = findSponsorRecordByEmail(email)

    assert.ok(sponsor)
    assert.equal(sponsor.email, email)
    assert.equal(sponsor.role, 'sponsor')

    writeEntity('sponsors', originalSponsors)
    writeEntity('users', originalUsers)
})

test('Approved proposals remain visible when sponsor IDs are stale or mismatched across sponsor records', () => {
    const originalSponsors = readEntity('sponsors', [])
    const originalUsers = readEntity('users', [])
    const originalProposals = readEntity('sponsorship_proposals', [])

    const email = 'history-sponsor@example.com'
    writeEntity('sponsors', [{ id: 1, company_name: 'History Sponsor Co.', role: 'sponsor', status: 'Active' }])
    writeEntity('users', [
        ...originalUsers,
        {
            id: 99,
            name: 'History Sponsor',
            company_name: 'History Sponsor Co.',
            email,
            phone: '9999999999',
            password: 'salt:hash',
            role: 'sponsor',
            created_at: new Date().toISOString(),
        },
    ])
    writeEntity('sponsorship_proposals', [
        {
            id: 101,
            proposal_id: 'SP-HISTORY-0001',
            sponsor_id: 1,
            amount: 250000,
            status: 'Approved',
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    ])

    const sponsor = findSponsorRecordByEmail(email)
    const proposals = getSponsorProposalsForAccount(sponsor)

    assert.ok(sponsor)
    assert.equal(sponsor.email, email)
    assert.equal(proposals.length, 1)
    assert.equal(proposals[0].proposal_id, 'SP-HISTORY-0001')

    writeEntity('sponsors', originalSponsors)
    writeEntity('users', originalUsers)
    writeEntity('sponsorship_proposals', originalProposals)
})

test('Real sponsor accounts are kept while placeholder fallback records are excluded', () => {
    const originalSponsors = readEntity('sponsors', [])
    const originalUsers = readEntity('users', [])

    writeEntity('sponsors', [
        { id: 4, company_name: 'dharatech', email: 'dhara@gmail.com', role: 'sponsor', status: 'Active' },
        { id: 5, company_name: 'Placeholder Sponsor', email: 'placeholder@example.com', role: 'sponsor', status: 'Active' },
    ])
    writeEntity('users', [
        ...originalUsers,
        {
            id: 10,
            name: 'True Sponsor',
            company_name: 'xo technology',
            email: 'xotech@gmail.com',
            phone: '9999999999',
            password: 'salt:hash',
            role: 'sponsor',
            created_at: new Date().toISOString(),
        },
    ])

    const { getAllSponsorAccounts } = require('../routes/sponsor')
    const sponsors = getAllSponsorAccounts()
    const names = sponsors.map((item) => String(item.company_name || item.name || '').trim())

    assert.ok(names.includes('dharatech'))
    assert.ok(names.includes('xo technology'))
    assert.ok(!names.includes('Placeholder Sponsor'))

    writeEntity('sponsors', originalSponsors)
    writeEntity('users', originalUsers)
})
