const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const { readEntity, writeEntity, nextId } = require('../lib/jsonStore')
const { analyzeProposal, getProposalAnalysis } = require('../lib/sponsorshipAgent')

const DEMO_SPONSOR_EVENTS = [
    {
        event_id: 1,
        name: 'Tech Innovation Summit',
        description: 'Tech Innovation Summit is a technology-focused event bringing together developers, startups, industry experts, and technology leaders.',
        location: 'Chennai',
        category: 'Technology',
        start_date: '2026-09-25T09:00:00.000Z',
        expected_attendees: 2000,
        status: 'Upcoming',
        sponsorship_status: 'Open for Sponsorship',
        highlights: ['Industry Speakers', 'Startup Exhibition', 'Networking Sessions', 'Technology Showcase', 'Product Demonstrations'],
        organizer_name: 'Innovation Council',
        organizer_email: 'organizer@techsummit.in',
        sponsorship_levels: { Platinum: 'Available', Gold: 'Available', Silver: 'Available' },
    },
    {
        event_id: 2,
        name: 'AI Future Conference',
        description: 'AI Future Conference unites researchers, founders, and enterprise leaders to discuss practical AI deployment.',
        location: 'Bangalore',
        category: 'AI',
        start_date: '2026-10-15T09:00:00.000Z',
        expected_attendees: 1500,
        status: 'Upcoming',
        sponsorship_status: 'Open for Sponsorship',
        highlights: ['AI Keynotes', 'Startup Pitches', 'Research Panels', 'Hands-on Demos', 'Investor Networking'],
        organizer_name: 'AI Research Lab',
        organizer_email: 'hello@aifutureconference.com',
        sponsorship_levels: { Platinum: 'Available', Gold: 'Available', Silver: 'Available' },
    },
    {
        event_id: 3,
        name: 'Startup Connect 2026',
        description: 'Startup Connect brings together emerging founders, investors, and ecosystem partners in one dynamic showcase.',
        location: 'Coimbatore',
        category: 'Startup',
        start_date: '2026-11-10T10:00:00.000Z',
        expected_attendees: 1000,
        status: 'Upcoming',
        sponsorship_status: 'Open for Sponsorship',
        highlights: ['Founder Stories', 'Pitch Arena', 'Investor Meetups', 'Startup Exhibition', 'Mentor Sessions'],
        organizer_name: 'Founders Circle',
        organizer_email: 'support@startupconnect.in',
        sponsorship_levels: { Platinum: 'Available', Gold: 'Available', Silver: 'Available' },
    },
    {
        event_id: 4,
        name: 'Healthcare Innovation Expo',
        description: 'A focused healthcare technology event exploring digital wellness, AI diagnostics, and smarter care delivery.',
        location: 'Hyderabad',
        category: 'Healthcare',
        start_date: '2026-08-05T09:00:00.000Z',
        expected_attendees: 1800,
        status: 'Completed',
        sponsorship_status: 'Sponsorship Closed',
        highlights: ['Clinical AI', 'Medical Startups', 'Policy Roundtable', 'Product Showcase', 'Care Delivery Sessions'],
        organizer_name: 'HealthTech Collective',
        organizer_email: 'team@healthtechcollective.org',
        sponsorship_levels: { Platinum: 'Unavailable', Gold: 'Unavailable', Silver: 'Unavailable' },
    },
]

function normalizeSponsorEvent(event) {
    const eventId = Number(event.event_id ?? event.id ?? 1)
    const dateValue = event.start_date || event.startDate || event.date || event.event_date || new Date().toISOString()
    const rawStatus = String(event.sponsorship_status || event.sponsorshipStatus || event.status || 'Upcoming').trim()
    const statusValue = rawStatus === 'COMPLETED' ? 'Completed' : rawStatus === 'CANCELLED' || rawStatus === 'Sponsorship Closed' ? 'Sponsorship Closed' : rawStatus === 'DRAFT' ? 'Upcoming' : rawStatus || 'Upcoming'

    return {
        id: eventId,
        event_id: eventId,
        name: event.name || 'Event',
        description: event.description || 'Event description coming soon.',
        location: event.location || 'Chennai',
        category: event.category || event.event_category || 'Technology',
        start_date: dateValue,
        date: dateValue,
        expected_attendees: Number(event.expected_attendees ?? event.expectedAttendees ?? 1200),
        status: event.status && String(event.status).toUpperCase() === 'COMPLETED' ? 'Completed' : (event.status || 'Upcoming'),
        sponsorship_status: statusValue === 'Completed' ? 'Sponsorship Closed' : statusValue,
        highlights: Array.isArray(event.highlights) && event.highlights.length ? event.highlights : ['Industry Speakers', 'Networking Sessions', 'Startup Showcase'],
        organizer_name: event.organizer_name || event.organizer || 'Event Organizer',
        organizer_email: event.organizer_email || event.contact_email || 'organizer@example.com',
        sponsorship_levels: event.sponsorship_levels || {
            Platinum: 'Available',
            Gold: 'Available',
            Silver: 'Available',
        },
    }
}

function getSponsorEvents() {
    const events = readEntity('events', [])

    if (Array.isArray(events) && events.length > 0) {
        return events
            .map(normalizeSponsorEvent)
            .filter((event) => !['CANCELLED'].includes(String(event.status || '').toUpperCase()))
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    }

    return DEMO_SPONSOR_EVENTS.map(normalizeSponsorEvent)
}

function isPlaceholderSponsorRecord(item) {
    if (!item) return true

    const role = String(item.role || '').trim().toLowerCase()
    if (role && role !== 'sponsor') return true

    const companyName = String(item.company_name || item.name || '').trim().toLowerCase()
    const contactPerson = String(item.contact_person || '').trim().toLowerCase()
    const email = String(item.email || '').trim().toLowerCase()
    const displayName = companyName || contactPerson || email

    const genericCompanyNames = ['sponsor', 'sponsor co.', 'sponsor company', 'company', 'unknown sponsor', 'unknown']
    const placeholderMarkers = ['fallback', 'legacy', 'placeholder', 'demo sponsor', 'sample sponsor', 'test sponsor', 'temp sponsor']
    const realSponsorNames = ['platinum one', 'gold brand', 'silver reach', 'xo technology', 'dharatech']

    if (!displayName) return true
    if (genericCompanyNames.includes(companyName) || genericCompanyNames.includes(contactPerson)) return true
    if (placeholderMarkers.some((marker) => companyName.includes(marker) || contactPerson.includes(marker) || email.includes(marker))) {
        return true
    }
    if (realSponsorNames.includes(companyName) || realSponsorNames.some((name) => companyName.includes(name))) return false

    if (!role && displayName) return false
    return false
}

function normalizeSponsorRecord(item) {
    if (!item) return null
    const normalized = {
        ...item,
        id: Number(item.id ?? item.sponsor_id ?? 0),
        company_name: item.company_name || item.name || 'Sponsor',
        contact_person: item.contact_person || item.name || '',
        email: String(item.email || '').trim(),
        role: String(item.role || 'sponsor').trim() || 'sponsor',
        status: item.status || 'Active',
    }
    return normalized
}

function findSponsorRecordByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) return null

    const sponsors = readEntity('sponsors', [])
    const directMatch = sponsors.find((item) => String(item.email || '').trim().toLowerCase() === normalizedEmail)
    if (directMatch && String(directMatch.role || '').trim().toLowerCase() === 'sponsor' && !isPlaceholderSponsorRecord(directMatch)) {
        return normalizeSponsorRecord(directMatch)
    }

    const users = readEntity('users', [])
    const userMatch = users.find((item) => String(item.email || '').trim().toLowerCase() === normalizedEmail && String(item.role || '').trim().toLowerCase() === 'sponsor')
    if (!userMatch || isPlaceholderSponsorRecord(userMatch)) {
        return null
    }

    return {
        ...normalizeSponsorRecord(userMatch),
        phone: userMatch.phone || '',
        industry: userMatch.industry || '',
        website: userMatch.website || '',
    }
}

function getAllSponsorAccounts() {
    const sponsors = readEntity('sponsors', [])
    const users = readEntity('users', [])

    const map = new Map()
    const assign = (item) => {
        const normalizedRole = String(item?.role || '').trim().toLowerCase()
        const hasMeaningfulSponsorIdentity = Boolean(item && (item.company_name || item.name || item.email || item.contact_person))
        const isSponsorLike = normalizedRole === 'sponsor' || (!normalizedRole && hasMeaningfulSponsorIdentity)
        if (!item || !isSponsorLike || isPlaceholderSponsorRecord(item)) return
        const email = String(item.email || '').trim().toLowerCase()
        const id = Number(item.id ?? item.sponsor_id ?? 0)
        const key = email || `id:${id}`
        const existing = map.get(key)

        if (existing) {
            map.set(key, {
                ...existing,
                ...item,
                id: Number(existing.id ?? item.id ?? item.sponsor_id ?? 0) || Number(item.id ?? item.sponsor_id ?? 0),
                email: existing.email || item.email || email,
                company_name: existing.company_name || item.company_name || item.name || 'Sponsor',
                contact_person: existing.contact_person || item.contact_person || item.name || '',
                role: 'sponsor',
                status: existing.status || item.status || 'Active',
            })
            return
        }

        map.set(key, {
            ...item,
            id: Number(item.id ?? item.sponsor_id ?? 0),
            company_name: item.company_name || item.name || 'Sponsor',
            contact_person: item.contact_person || item.name || '',
            email: email || item.email || '',
            role: 'sponsor',
            status: item.status || 'Active',
        })
    }

    sponsors.forEach(assign)
    users.forEach(assign)

    return Array.from(map.values())
}

function getAllRawSponsorAccounts() {
    const sponsors = readEntity('sponsors', [])
    const users = readEntity('users', [])

    const map = new Map()
    const assign = (item) => {
        if (!item || String(item.role || '').trim().toLowerCase() !== 'sponsor') return
        const email = String(item.email || '').trim().toLowerCase()
        const id = Number(item.id ?? item.sponsor_id ?? 0)
        const key = email || `id:${id}`
        const existing = map.get(key)

        if (existing) {
            map.set(key, {
                ...existing,
                ...item,
                id: Number(existing.id ?? item.id ?? item.sponsor_id ?? 0) || Number(item.id ?? item.sponsor_id ?? 0),
                email: existing.email || item.email || email,
                company_name: existing.company_name || item.company_name || item.name || 'Sponsor',
                contact_person: existing.contact_person || item.contact_person || item.name || '',
                role: 'sponsor',
                status: existing.status || item.status || 'Active',
            })
            return
        }

        map.set(key, {
            ...item,
            id: Number(item.id ?? item.sponsor_id ?? 0),
            company_name: item.company_name || item.name || 'Sponsor',
            contact_person: item.contact_person || item.name || '',
            email: email || item.email || '',
            role: 'sponsor',
            status: item.status || 'Active',
        })
    }

    sponsors.forEach(assign)
    users.forEach(assign)

    return Array.from(map.values())
}

function getSponsorAccountIds(sponsor) {
    const ids = new Set()
    if (!sponsor) return []

    const addId = (value) => {
        const numeric = Number(value)
        if (Number.isFinite(numeric) && numeric > 0) ids.add(numeric)
    }

    addId(sponsor.id)
    addId(sponsor.sponsor_id)

    const normalizedEmail = String(sponsor.email || '').trim().toLowerCase()
    const normalizedCompany = String(sponsor.company_name || sponsor.name || '').trim().toLowerCase()

    getAllRawSponsorAccounts().forEach((item) => {
        const sameEmail = normalizedEmail && String(item.email || '').trim().toLowerCase() === normalizedEmail
        const sameCompany = normalizedCompany && String(item.company_name || item.name || '').trim().toLowerCase() === normalizedCompany
        if (sameEmail || sameCompany) {
            addId(item.id)
            addId(item.sponsor_id)
        }
    })

    return Array.from(ids)
}

function getSponsorProposalsForAccount(sponsor) {
    if (!sponsor) return []

    const eligibleIds = new Set(getSponsorAccountIds(sponsor))
    const proposals = readEntity('sponsorship_proposals', [])

    if (eligibleIds.size === 0) {
        return []
    }

    return proposals
        .filter((item) => eligibleIds.has(Number(item.sponsor_id)))
        .sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at))
}

function getSponsorPackages(eventId) {
    const normalizedEventId = Number(eventId)
    const basePackages = [
        {
            id: 1,
            package_id: 1,
            event_id: normalizedEventId,
            name: 'Platinum',
            label: 'Platinum Sponsorship',
            price: 500000,
            description: 'Premium sponsorship package',
            benefits: ['Main Stage Branding', 'Promotional Session', 'Exhibition Booth', 'Social Media Promotion', '5 Complimentary Passes'],
            availability: 'Available',
        },
        {
            id: 2,
            package_id: 2,
            event_id: normalizedEventId,
            name: 'Gold',
            label: 'Gold Sponsorship',
            price: 300000,
            description: 'High-visibility sponsorship package',
            benefits: ['Stage Branding', 'Exhibition Booth', 'Social Media Promotion', '3 Complimentary Passes'],
            availability: 'Available',
        },
        {
            id: 3,
            package_id: 3,
            event_id: normalizedEventId,
            name: 'Silver',
            label: 'Silver Sponsorship',
            price: 150000,
            description: 'Brand visibility package',
            benefits: ['Event Branding', 'Promotional Listing', '2 Complimentary Passes'],
            availability: 'Available',
        },
    ]

    return basePackages.map((pkg) => ({
        ...pkg,
        price_label: `₹${Number(pkg.price).toLocaleString('en-IN')}`,
        id: Number(pkg.id),
        package_id: Number(pkg.package_id),
        event_id: Number(pkg.event_id),
    }))
}

function saveSponsorshipRequirements(payload = {}) {
    const requirementsList = readEntity('sponsorship_requirements', [])
    const normalized = {
        id: nextId(requirementsList),
        sponsor_id: Number(payload.sponsor_id ?? payload.sponsorId ?? 0),
        event_id: Number(payload.event_id ?? payload.eventId ?? 0),
        package_id: Number(payload.package_id ?? payload.packageId ?? 0),
        amount: Number(payload.amount ?? 0),
        booth_required: Boolean(payload.booth_required ?? payload.boothRequired ?? false),
        booth_preference: String(payload.booth_preference ?? payload.boothPreference ?? 'Not Required').trim(),
        branding_requirements: Array.isArray(payload.branding_requirements)
            ? payload.branding_requirements.map((item) => String(item).trim()).filter(Boolean)
            : Array.isArray(payload.brandingRequirements)
                ? payload.brandingRequirements.map((item) => String(item).trim()).filter(Boolean)
                : [],
        promotional_sessions: Number(payload.promotional_sessions ?? payload.promotionalSessions ?? 0),
        special_requirements: String(payload.special_requirements ?? payload.specialRequirements ?? '').trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }

    requirementsList.push(normalized)
    writeEntity('sponsorship_requirements', requirementsList)
    return normalized
}

function generateProposalNumber() {
    const proposals = readEntity('sponsorship_proposals', [])
    const year = new Date().getFullYear()
    const nextIndex = proposals.length + 1
    return `SP-${year}-${String(nextIndex).padStart(4, '0')}`
}

function saveProposal(payload = {}) {
    const proposals = readEntity('sponsorship_proposals', [])
    const normalized = {
        id: nextId(proposals),
        proposal_id: String(payload.proposal_id || generateProposalNumber()).trim(),
        sponsor_id: Number(payload.sponsor_id ?? payload.sponsorId ?? 0),
        event_id: Number(payload.event_id ?? payload.eventId ?? 0),
        package_id: Number(payload.package_id ?? payload.packageId ?? 0),
        requirement_id: Number(payload.requirement_id ?? payload.requirementId ?? 0),
        amount: Number(payload.amount ?? 0),
        status: String(payload.status || 'Pending Review').trim(),
        submitted_at: payload.submitted_at || new Date().toISOString(),
        created_at: payload.created_at || new Date().toISOString(),
        updated_at: payload.updated_at || new Date().toISOString(),
        booth_required: Boolean(payload.booth_required ?? false),
        booth_preference: String(payload.booth_preference ?? 'Not Required').trim(),
        branding_requirements: Array.isArray(payload.branding_requirements)
            ? payload.branding_requirements.map((item) => String(item).trim()).filter(Boolean)
            : [],
        promotional_sessions: Number(payload.promotional_sessions ?? 0),
        special_requirements: String(payload.special_requirements ?? '').trim(),
        notes: String(payload.notes ?? '').trim(),
    }

    proposals.push(normalized)
    writeEntity('sponsorship_proposals', proposals)
    return normalized
}

// Password Hashing Helpers
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto
        .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
        .toString('hex')
    return `${salt}:${hash}`
}

function comparePassword(password, storedHash) {
    if (!storedHash || typeof storedHash !== 'string') return false
    if (!storedHash.includes(':')) {
        return String(password) === storedHash
    }
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) return false
    const derived = crypto
        .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
        .toString('hex')
    return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(derived, 'hex')
    )
}

function isStrongPassword(password) {
    const value = String(password || '')
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value)
}

// Sponsor Authentication Middleware
const requireSponsor = (req, res, next) => {
    const email = String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase()
    const role = String(req.headers['x-user-role'] || '').trim().toLowerCase()
    const sponsor = findSponsorRecordByEmail(email)

    if (!sponsor || String(sponsor.role || '').trim().toLowerCase() !== 'sponsor') {
        return res.status(403).json({ message: 'Sponsor access required.' })
    }

    if (role && role !== 'sponsor') {
        console.warn(`Sponsor auth mismatch for ${email}; allowing known sponsor record.`)
    }

    req.authSponsor = sponsor
    return next()
}

function resolveSponsorFromRequest(req) {
    const email = String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase()
    const sponsorByEmail = findSponsorRecordByEmail(email)
    if (sponsorByEmail) {
        return sponsorByEmail
    }

    const sponsors = readEntity('sponsors', [])
    const sponsorId = Number(req.body?.sponsor_id ?? req.body?.sponsorId ?? 0)
    if (sponsorId > 0) {
        const byId = sponsors.find((item) => Number(item.id) === sponsorId)
        if (byId && String(byId.role || '').trim().toLowerCase() === 'sponsor') {
            return byId
        }
    }

    return null
}

// Registration Endpoint
router.post('/register', async (req, res) => {
    try {
        const {
            companyName,
            contactPerson,
            email,
            phone,
            industry,
            website,
            password,
            confirmPassword,
        } = req.body || {}

        if (!companyName || !contactPerson || !email || !phone || !industry || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All required fields must be provided.' })
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' })
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message:
                    'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.',
            })
        }

        const normalizedEmail = String(email).trim().toLowerCase()
        const sponsors = readEntity('sponsors', [])
        const existing = sponsors.find(
            (item) => String(item.email || '').trim().toLowerCase() === normalizedEmail
        )

        if (existing) {
            return res.status(409).json({ message: 'A sponsor account with this email already exists.' })
        }

        const newSponsor = {
            id: nextId(sponsors),
            company_name: String(companyName).trim(),
            contact_person: String(contactPerson).trim(),
            email: normalizedEmail,
            phone: String(phone).trim(),
            industry: String(industry).trim(),
            website: website ? String(website).trim() : '',
            password: hashPassword(password),
            role: 'sponsor',
            status: 'Active',
            logo: '',
            active_sponsorships: 2,
            pending_proposals: 1,
            total_sponsorship_value: 800000,
            pending_payments: 200000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        sponsors.push(newSponsor)
        writeEntity('sponsors', sponsors)

        // Sync into users entity with role='sponsor' for unified lookup
        const users = readEntity('users', [])
        if (!users.some((u) => String(u.email || '').toLowerCase() === normalizedEmail)) {
            users.push({
                id: nextId(users),
                name: newSponsor.contact_person,
                company_name: newSponsor.company_name,
                email: normalizedEmail,
                phone: newSponsor.phone,
                password: newSponsor.password,
                role: 'sponsor',
                created_at: newSponsor.created_at,
            })
            writeEntity('users', users)
        }

        return res.status(201).json({
            message: 'Sponsor registration successful. Please log in.',
            sponsor: {
                id: newSponsor.id,
                company_name: newSponsor.company_name,
                contact_person: newSponsor.contact_person,
                email: newSponsor.email,
                role: newSponsor.role,
            },
        })
    } catch (error) {
        console.error('Error during sponsor registration:', error)
        return res.status(500).json({ message: 'Internal server error during registration.' })
    }
})

// Login Endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {}
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' })
        }

        const normalizedEmail = String(email).trim().toLowerCase()
        const sponsor = findSponsorRecordByEmail(normalizedEmail)

        if (!sponsor) {
            return res.status(401).json({ message: 'Invalid email or password.' })
        }

        const valid = comparePassword(password, sponsor.password)
        if (!valid) {
            return res.status(401).json({ message: 'Invalid email or password.' })
        }

        const sanitizedSponsor = {
            id: sponsor.id,
            company_name: sponsor.company_name,
            contact_person: sponsor.contact_person,
            email: sponsor.email,
            phone: sponsor.phone || '',
            industry: sponsor.industry || '',
            website: sponsor.website || '',
            role: 'sponsor',
            status: sponsor.status || 'Active',
        }

        return res.json({
            message: 'Sponsor login successful',
            user: sanitizedSponsor,
        })
    } catch (error) {
        console.error('Error during sponsor login:', error)
        return res.status(500).json({ message: 'Internal server error during login.' })
    }
})

// Dashboard Stats Endpoint
function generateSponsorRecommendations(sponsorId, sponsorRecord = {}, proposals = [], payments = [], deliverables = []) {
    const sponsorProposals = proposals
        .filter((item) => Number(item.sponsor_id) === Number(sponsorId))
        .sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at))

    const approvedProposals = sponsorProposals.filter((item) => String(item.status || '').trim().toLowerCase() === 'approved')
    const paymentRecords = payments.filter((item) => Number(item.sponsor_id) === Number(sponsorId))
    const deliverableRecords = deliverables.filter((item) => Number(item.sponsor_id) === Number(sponsorId))

    const totalPaymentValue = paymentRecords.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const paidAmount = paymentRecords.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0)
    const dueAmount = paymentRecords.reduce((sum, item) => sum + Number(item.due_amount || 0), 0)
    const totalDeliverables = deliverableRecords.length || Math.max(1, approvedProposals.length * 4)
    const completedDeliverables = deliverableRecords.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length
    const delayedDeliverables = deliverableRecords.filter((item) => String(item.status || '').trim().toLowerCase() === 'delayed').length
    const pendingDeliverables = deliverableRecords.filter((item) => String(item.status || '').trim().toLowerCase() !== 'completed' && String(item.status || '').trim().toLowerCase() !== 'delivered').length
    const paymentCompletion = totalPaymentValue ? (paidAmount / totalPaymentValue) * 100 : 0
    const deliveryCompletion = totalDeliverables ? (completedDeliverables / totalDeliverables) * 100 : 0
    const approvalRate = sponsorProposals.length ? (approvedProposals.length / sponsorProposals.length) * 100 : 0
    const engagerScore = Number(sponsorRecord?.engagement_score || sponsorRecord?.performance_score || 0)
    const engagementSignal = engagerScore || Math.max(55, Math.min(96, Math.round((approvalRate * 0.5) + (deliveryCompletion * 0.3) + (paymentCompletion * 0.2))))

    const recommendations = []

    if (dueAmount > 0) {
        recommendations.push({
            id: `payments-${sponsorId}`,
            sponsorship_id: approvedProposals[0]?.proposal_id || sponsorId,
            category: 'Payments',
            priority: paymentCompletion < 65 ? 'High' : 'Medium',
            recommendation: paymentCompletion < 65 ? 'Follow up on the pending sponsorship payment.' : 'Continue monitoring the existing payment schedule.',
            reason: `Payment completion is ${Math.round(paymentCompletion)}%.`,
            explanation: `Your payment records show ₹${Number(paidAmount).toLocaleString('en-IN')} paid and ₹${Number(dueAmount).toLocaleString('en-IN')} still due. Following up on outstanding sponsorship payments helps maintain payment reliability and reduces risk for future partnerships.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
    }

    if (delayedDeliverables > 0 || pendingDeliverables > 0) {
        recommendations.push({
            id: `deliverables-${sponsorId}`,
            sponsorship_id: approvedProposals[0]?.proposal_id || sponsorId,
            category: 'Deliverables',
            priority: delayedDeliverables > 0 ? 'High' : 'Medium',
            recommendation: delayedDeliverables > 0 ? 'Prioritize delayed sponsorship deliverables before the event day.' : 'Finish the pending deliverables to complete the sponsorship scope.',
            reason: delayedDeliverables > 0 ? `${delayedDeliverables} deliverable(s) are delayed.` : `${pendingDeliverables} deliverable(s) are still pending.`,
            explanation: `The current deliverable completion rate is ${Math.round(deliveryCompletion)}%. Completing pending items on time keeps sponsor commitments aligned with the event plan and improves future package performance.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
    }

    if (approvedProposals.length > 0 && approvalRate >= 50) {
        recommendations.push({
            id: `package-${sponsorId}`,
            sponsorship_id: approvedProposals[0]?.proposal_id || sponsorId,
            category: 'Package Selection',
            priority: 'Low',
            recommendation: 'Consider a premium sponsorship package for future events.',
            reason: `Your recent sponsorship activity shows ${approvedProposals.length} approved opportunities and strong value generation.`,
            explanation: `The portfolio value for ${sponsorRecord?.company_name || 'this sponsor'} currently stands at ₹${Number(totalPaymentValue || approvedProposals.reduce((sum, item) => sum + Number(item.amount || 0), 0)).toLocaleString('en-IN')}. A premium package may better match your past event engagement and value.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
    }

    if (engagementSignal >= 80) {
        recommendations.push({
            id: `retention-${sponsorId}`,
            sponsorship_id: approvedProposals[0]?.proposal_id || sponsorId,
            category: 'Sponsor Retention',
            priority: 'Low',
            recommendation: 'Prioritize this sponsor for future events.',
            reason: 'Sponsorship performance remains consistently strong across approved opportunities.',
            explanation: `Current performance indicators suggest an engagement score of ${engagementSignal}/100 with strong delivery completion. Retaining this sponsor supports future event continuity and creates a dependable partnership pipeline.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
    }

    if (recommendations.length === 0) {
        recommendations.push({
            id: `engagement-${sponsorId}`,
            sponsorship_id: approvedProposals[0]?.proposal_id || sponsorId,
            category: 'Engagement',
            priority: 'Medium',
            recommendation: 'Maintain the current sponsorship strategy and monitor engagement milestones.',
            reason: 'Performance data is currently within a healthy operating range.',
            explanation: `This sponsor has ${approvedProposals.length} approved sponsorship(s), a payment completion of ${Math.round(paymentCompletion)}%, and delivery completion of ${Math.round(deliveryCompletion)}%. Maintaining the current plan should support steady future performance.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
    }

    const summary = `${sponsorRecord?.company_name || 'Sponsor'} has ${recommendations.length} AI recommendation${recommendations.length > 1 ? 's' : ''} based on actual sponsorship, payment, and deliverable data.`

    return {
        sponsor_id: Number(sponsorId),
        company_name: sponsorRecord?.company_name || 'Sponsor',
        recommendations,
        summary,
    }
}

function buildSponsorPerformanceReport(sponsorId, sponsorRecord = {}, proposalSummary = {}, paymentSummary = {}, deliverableSummary = {}, engagementSummary = {}, performanceSummary = {}, recommendations = []) {
    const eventName = proposalSummary?.event_name || 'Event Sponsorship'
    const packageName = proposalSummary?.package_name || 'Sponsorship Package'
    const sponsorshipValue = Number(proposalSummary?.amount || paymentSummary?.total || 0)
    const totalAmount = Number(paymentSummary?.total || sponsorshipValue || 0)
    const paidAmount = Number(paymentSummary?.paid || 0)
    const pendingAmount = Number(paymentSummary?.due || paymentSummary?.pending || (totalAmount - paidAmount))
    const totalDeliverables = Number(deliverableSummary?.total || 0)
    const completedDeliverables = Number(deliverableSummary?.completed || 0)
    const pendingDeliverables = Number(deliverableSummary?.pending || 0)
    const delayedDeliverables = Number(deliverableSummary?.delayed || 0)
    const completionRate = Number(deliverableSummary?.completion_rate || (totalDeliverables ? (completedDeliverables / totalDeliverables) * 100 : 0))
    const boothVisits = Number(engagementSummary?.booth_visits || 0)
    const interactions = Number(engagementSummary?.attendee_interactions || 0)
    const leads = Number(engagementSummary?.leads || 0)
    const qualifiedLeads = Number(engagementSummary?.qualified_leads || 0)
    const convertedLeads = Number(engagementSummary?.converted_leads || 0)
    const conversionRate = Number(engagementSummary?.conversion_rate || 0)
    const engagementScore = Number(performanceSummary?.engagement_score || 0)
    const satisfaction = Number(performanceSummary?.satisfaction || 0)
    const overallPerformance = Number(performanceSummary?.overall_performance || engagementScore || 0)
    const aiRecommendations = Array.isArray(recommendations) ? recommendations : []

    const summary = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'Sponsor Performance Report',
        '',
        sponsorRecord?.company_name || 'Sponsor',
        '',
        eventName,
        `${packageName} Sponsorship`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'SPONSORSHIP',
        `Value             ₹${Number(sponsorshipValue).toLocaleString('en-IN')}`,
        `Status            ${proposalSummary?.status || 'Active'}`,
        '',
        'PAYMENTS',
        `Paid              ₹${Number(paidAmount).toLocaleString('en-IN')}`,
        `Pending           ₹${Number(pendingAmount).toLocaleString('en-IN')}`,
        `Status            ${pendingAmount > 0 ? 'Partially Paid' : 'Paid'}`,
        '',
        'DELIVERABLES',
        `Completed         ${completedDeliverables} / ${totalDeliverables || completedDeliverables || 0}`,
        `Progress          ${Math.round(completionRate)}%`,
        '',
        'ENGAGEMENT',
        `Booth Visits      ${boothVisits}`,
        `Interactions      ${interactions}`,
        `Leads             ${leads}`,
        `Conversions       ${convertedLeads}`,
        '',
        'PERFORMANCE',
        `Engagement        ${engagementScore}%`,
        `Satisfaction      ${satisfaction} / 5`,
        `Overall Score     ${overallPerformance}%`,
        '',
        'AI RECOMMENDATION',
        aiRecommendations.length ? aiRecommendations[0].recommendation : 'Maintain current sponsorship strategy.',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ].join('\n')

    return {
        id: `report-${sponsorId}-${proposalSummary?.proposal_id || 'latest'}`,
        sponsor_id: Number(sponsorId),
        company_name: sponsorRecord?.company_name || 'Sponsor',
        event_name: eventName,
        package_name: packageName,
        sponsorship_value: sponsorshipValue,
        payment: {
            total: totalAmount,
            paid: paidAmount,
            pending: pendingAmount,
            status: pendingAmount > 0 ? 'Partially Paid' : 'Paid',
        },
        deliverables: {
            total: totalDeliverables,
            completed: completedDeliverables,
            pending: pendingDeliverables,
            delayed: delayedDeliverables,
            completion_rate: completionRate,
        },
        engagement: {
            booth_visits: boothVisits,
            attendee_interactions: interactions,
            leads,
            qualified_leads: qualifiedLeads,
            converted_leads: convertedLeads,
            conversion_rate: conversionRate,
        },
        performance: {
            engagement_score: engagementScore,
            satisfaction,
            overall_performance: overallPerformance,
        },
        recommendations: aiRecommendations,
        summary,
    }
}

function markSponsorPaymentPaid(sponsorId, proposalId, amount = null) {
    const sponsorIdNumber = Number(sponsorId)
    const paymentRecords = readEntity('sponsorship_payments', [])
    const targetProposalId = String(proposalId)
    const existingIndex = paymentRecords.findIndex((item) => Number(item.sponsor_id) === sponsorIdNumber && String(item.proposal_id) === targetProposalId)

    const dueAmount = Number(amount ?? 0)
    const payment = existingIndex >= 0 ? paymentRecords[existingIndex] : {
        id: nextId(paymentRecords),
        proposal_id: targetProposalId,
        sponsor_id: sponsorIdNumber,
        event_id: 0,
        package_id: 0,
        amount: dueAmount,
        paid_amount: 0,
        due_amount: dueAmount,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }

    const totalAmount = Number(payment.amount || 0)
    const currentPaid = Number(payment.paid_amount || 0)
    const currentDue = Number(payment.due_amount || 0)
    const paymentAmount = Number(amount ?? (currentDue || totalAmount || 0))
    const resolvedAmount = Math.min(Math.max(paymentAmount, 0), Math.max(totalAmount > 0 ? totalAmount - currentPaid : currentDue, 0))
    const nextPaid = Math.min(totalAmount || (currentPaid + resolvedAmount), currentPaid + resolvedAmount)
    const nextDue = Math.max(0, (totalAmount || currentDue) - nextPaid)

    const updatedPayment = {
        ...payment,
        amount: totalAmount || paymentAmount,
        paid_amount: nextPaid,
        due_amount: nextDue,
        status: nextDue <= 0 ? 'Paid' : 'Partial',
        updated_at: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
        paymentRecords[existingIndex] = updatedPayment
    } else {
        paymentRecords.push(updatedPayment)
    }

    writeEntity('sponsorship_payments', paymentRecords)

    return {
        updated: true,
        payment: updatedPayment,
        amountPaid: resolvedAmount,
    }
}

function buildSponsorPerformanceSummary(sponsorId, sponsorRecord = {}, proposals = [], payments = [], deliverables = []) {
    const sponsorProposals = proposals
        .filter((item) => Number(item.sponsor_id) === Number(sponsorId))
        .sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at))

    const approvedProposals = sponsorProposals.filter((item) => String(item.status || '').trim().toLowerCase() === 'approved')
    const proposalCount = sponsorProposals.length
    const approvedValue = approvedProposals.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const paidAmount = payments
        .filter((item) => Number(item.sponsor_id) === Number(sponsorId))
        .reduce((sum, item) => sum + Number(item.paid_amount || 0), 0)
    const dueAmount = payments
        .filter((item) => Number(item.sponsor_id) === Number(sponsorId))
        .reduce((sum, item) => sum + Number(item.due_amount || 0), 0)
    const deliverableItems = deliverables.filter((item) => Number(item.sponsor_id) === Number(sponsorId))
    const completedDeliverables = deliverableItems.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length
    const completionRate = deliverableItems.length ? (completedDeliverables / deliverableItems.length) * 100 : 0
    const conversionRate = proposalCount ? (approvedProposals.length / proposalCount) * 100 : 0
    const paymentReliability = approvedValue || paidAmount || dueAmount ? Math.min(100, Math.round((paidAmount / Math.max(approvedValue, paidAmount + dueAmount, 1)) * 100)) : 0
    const engagementScore = Math.round((conversionRate * 0.5) + (completionRate * 0.3) + (paymentReliability * 0.2))

    let performanceStatus = 'Needs Focus'
    if (engagementScore >= 65) performanceStatus = 'Strong'
    else if (engagementScore >= 50) performanceStatus = 'Healthy'
    else if (engagementScore >= 30) performanceStatus = 'Moderate'

    return {
        companyName: sponsorRecord?.company_name || 'Sponsor',
        totalSponsorships: approvedProposals.length,
        approvedValue,
        paidAmount,
        dueAmount,
        conversionRate: Number(conversionRate.toFixed(1)),
        completionRate: Number(completionRate.toFixed(1)),
        paymentReliability,
        engagementScore,
        performanceStatus,
        dataAvailable: proposalCount > 0 || payments.length > 0 || deliverableItems.length > 0,
        engagementBreakdown: [
            {
                label: 'Conversion Rate',
                value: `${Number(conversionRate.toFixed(1))}%`,
                detail: `${approvedProposals.length}/${proposalCount || 0} proposals approved`,
            },
            {
                label: 'Deliverable Completion',
                value: `${Number(completionRate.toFixed(1))}%`,
                detail: `${completedDeliverables}/${deliverableItems.length || 0} tasks completed`,
            },
            {
                label: 'Payment Reliability',
                value: `${paymentReliability}%`,
                detail: `₹${Number(paidAmount).toLocaleString('en-IN')} paid`,
            },
            {
                label: 'Engagement Score',
                value: `${engagementScore}/100`,
                detail: performanceStatus,
            },
        ],
    }
}

function buildSponsorTrackingSnapshot(sponsorId) {
    const proposals = readEntity('sponsorship_proposals', [])
    const payments = readEntity('sponsorship_payments', [])
    const deliverables = readEntity('sponsorship_deliverables', [])
    const sponsorProposals = proposals
        .filter((item) => Number(item.sponsor_id) === Number(sponsorId))
        .sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at))

    const approvedProposals = sponsorProposals.filter((item) => String(item.status || '').trim().toLowerCase() === 'approved')
    const pendingProposals = sponsorProposals.filter((item) => String(item.status || '').trim().toLowerCase() !== 'approved' && String(item.status || '').trim().toLowerCase() !== 'rejected')

    const totalApprovedValue = approvedProposals.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const sponsorPayments = payments.filter((item) => Number(item.sponsor_id) === Number(sponsorId))
    const sponsorDeliverables = deliverables.filter((item) => Number(item.sponsor_id) === Number(sponsorId))
    const paidAmount = sponsorPayments.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0)
    const pendingAmount = sponsorPayments.reduce((sum, item) => sum + Number(item.due_amount || 0), 0)
    const completedDeliverables = sponsorDeliverables.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length
    const totalDeliverables = sponsorDeliverables.length || Math.max(1, approvedProposals.length * 4)
    const progress = Math.min(100, Math.round((completedDeliverables / totalDeliverables) * 100))

    const activeSponsorships = approvedProposals.map((proposal) => {
        const event = getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id)) || null
        const packageInfo = getSponsorPackages(Number(proposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(proposal.package_id)) || null
        return {
            id: proposal.id,
            proposal_id: proposal.proposal_id,
            eventName: event?.name || 'Event Sponsorship',
            tier: packageInfo?.label || 'Sponsorship Package',
            amount: `₹${Number(proposal.amount || 0).toLocaleString('en-IN')}`,
            status: proposal.status || 'Approved',
            event_id: Number(proposal.event_id || 0),
            package_id: Number(proposal.package_id || 0),
        }
    })

    return {
        companyName: reqAuthSponsor ? reqAuthSponsor.company_name : undefined,
        activeSponsorshipsCount: activeSponsorships.length,
        pendingProposalsCount: pendingProposals.length,
        totalSponsorshipValue: `₹${totalApprovedValue.toLocaleString('en-IN')}`,
        pendingPayments: `₹${pendingAmount.toLocaleString('en-IN')}`,
        paymentSummary: {
            total: `₹${totalApprovedValue.toLocaleString('en-IN')}`,
            paid: `₹${paidAmount.toLocaleString('en-IN')}`,
            pending: `₹${pendingAmount.toLocaleString('en-IN')}`,
        },
        deliverableProgress: {
            completed: completedDeliverables,
            pending: Math.max(0, totalDeliverables - completedDeliverables),
            progress,
        },
        activeSponsorships,
        pendingProposals: pendingProposals.slice(0, 3).map((proposal) => ({
            id: proposal.id,
            proposal_id: proposal.proposal_id,
            eventName: getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id))?.name || 'Event Sponsorship',
            tier: getSponsorPackages(Number(proposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(proposal.package_id))?.label || 'Sponsorship Package',
            amount: `₹${Number(proposal.amount || 0).toLocaleString('en-IN')}`,
            status: proposal.status || 'Pending Review',
        })),
        recentNotifications: readEntity('notifications', []).filter((item) => String(item.recipient_email || '').toLowerCase() === String(sponsorId).toLowerCase() || Number(item.sponsor_id) === Number(sponsorId) || String(item.recipient_role || '').toLowerCase() === 'sponsor').slice(0, 3).map((item) => ({
            id: item.id,
            text: item.title || item.message || 'Sponsorship update',
            type: item.type === 'danger' ? 'warning' : item.type === 'success' ? 'success' : 'info',
        })),
    }
}

router.get('/dashboard-stats', requireSponsor, async (req, res) => {
    try {
        const sponsor = req.authSponsor
        const proposals = readEntity('sponsorship_proposals', [])
        const approvedProposals = proposals.filter((item) => Number(item.sponsor_id) === Number(sponsor.id) && String(item.status || '').trim().toLowerCase() === 'approved')
        const pendingProposals = proposals.filter((item) => Number(item.sponsor_id) === Number(sponsor.id) && String(item.status || '').trim().toLowerCase() !== 'approved' && String(item.status || '').trim().toLowerCase() !== 'rejected')
        const paymentRecords = readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === Number(sponsor.id))
        const deliverableRecords = readEntity('sponsorship_deliverables', []).filter((item) => Number(item.sponsor_id) === Number(sponsor.id))
        const totalApprovedValue = approvedProposals.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        const paidAmount = paymentRecords.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0)
        const pendingAmount = paymentRecords.reduce((sum, item) => sum + Number(item.due_amount || 0), 0)
        const completedDeliverables = deliverableRecords.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length
        const totalDeliverables = Math.max(deliverableRecords.length, 1)
        const progress = Math.min(100, Math.round((completedDeliverables / totalDeliverables) * 100))

        const stats = {
            companyName: sponsor.company_name || 'ABC Technologies',
            contactPerson: sponsor.contact_person || 'Sponsor Admin',
            activeSponsorshipsCount: approvedProposals.length,
            pendingProposalsCount: pendingProposals.length,
            totalSponsorshipValue: `₹${totalApprovedValue.toLocaleString('en-IN')}`,
            pendingPayments: `₹${pendingAmount.toLocaleString('en-IN')}`,
            paymentSummary: {
                total: `₹${totalApprovedValue.toLocaleString('en-IN')}`,
                paid: `₹${paidAmount.toLocaleString('en-IN')}`,
                pending: `₹${pendingAmount.toLocaleString('en-IN')}`,
            },
            deliverableProgress: {
                completed: completedDeliverables,
                pending: Math.max(0, totalDeliverables - completedDeliverables),
                progress,
            },
            activeSponsorships: approvedProposals.slice(0, 3).map((proposal) => {
                const event = getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id)) || null
                const packageInfo = getSponsorPackages(Number(proposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(proposal.package_id)) || null
                return {
                    id: proposal.proposal_id,
                    eventName: event?.name || 'Event Sponsorship',
                    tier: packageInfo?.label || 'Sponsorship Package',
                    amount: `₹${Number(proposal.amount || 0).toLocaleString('en-IN')}`,
                    status: proposal.status || 'Approved',
                }
            }),
            pendingProposals: pendingProposals.slice(0, 3).map((proposal) => {
                const event = getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id)) || null
                const packageInfo = getSponsorPackages(Number(proposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(proposal.package_id)) || null
                return {
                    id: proposal.proposal_id,
                    eventName: event?.name || 'Event Sponsorship',
                    tier: packageInfo?.label || 'Sponsorship Package',
                    amount: `₹${Number(proposal.amount || 0).toLocaleString('en-IN')}`,
                    status: proposal.status || 'Pending Review',
                }
            }),
            recentNotifications: readEntity('notifications', [])
                .filter((item) => String(item.recipient_email || '').trim().toLowerCase() === String(sponsor.email || '').trim().toLowerCase() || String(item.recipient_role || '').trim().toLowerCase() === 'sponsor')
                .slice(0, 3)
                .map((item) => ({
                    id: item.id,
                    text: item.title || item.message || 'Sponsorship update',
                    type: item.type === 'danger' ? 'warning' : item.type === 'success' ? 'success' : 'info',
                })),
        }

        return res.json(stats)
    } catch (error) {
        console.error('Error fetching sponsor dashboard stats:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor dashboard stats.' })
    }
})

// Get Profile Endpoint
router.get('/profile', requireSponsor, async (req, res) => {
    try {
        const sponsor = req.authSponsor
        return res.json({
            id: sponsor.id,
            company_name: sponsor.company_name,
            contact_person: sponsor.contact_person,
            email: sponsor.email,
            phone: sponsor.phone || '',
            industry: sponsor.industry || '',
            website: sponsor.website || '',
            status: sponsor.status || 'Active',
            logo: sponsor.logo || '',
            role: 'sponsor',
        })
    } catch (error) {
        console.error('Error fetching sponsor profile:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor profile.' })
    }
})

// Update Profile Endpoint
router.put('/profile', requireSponsor, async (req, res) => {
    try {
        const { companyName, contactPerson, phone, industry, website, logo } = req.body || {}
        const sponsors = readEntity('sponsors', [])
        const idx = sponsors.findIndex(
            (item) => String(item.email || '').trim().toLowerCase() === req.authSponsor.email
        )

        if (idx === -1) {
            return res.status(404).json({ message: 'Sponsor record not found.' })
        }

        if (companyName) sponsors[idx].company_name = String(companyName).trim()
        if (contactPerson) sponsors[idx].contact_person = String(contactPerson).trim()
        if (phone) sponsors[idx].phone = String(phone).trim()
        if (industry) sponsors[idx].industry = String(industry).trim()
        if (website !== undefined) sponsors[idx].website = String(website).trim()
        if (logo !== undefined) sponsors[idx].logo = String(logo).trim()
        sponsors[idx].updated_at = new Date().toISOString()

        writeEntity('sponsors', sponsors)

        return res.json({
            message: 'Profile updated successfully',
            sponsor: {
                id: sponsors[idx].id,
                company_name: sponsors[idx].company_name,
                contact_person: sponsors[idx].contact_person,
                email: sponsors[idx].email,
                phone: sponsors[idx].phone,
                industry: sponsors[idx].industry,
                website: sponsors[idx].website,
                status: sponsors[idx].status,
                logo: sponsors[idx].logo,
                role: 'sponsor',
            },
        })
    } catch (error) {
        console.error('Error updating sponsor profile:', error)
        return res.status(500).json({ message: 'Failed to update sponsor profile.' })
    }
})

// Browse Events Endpoint
router.get('/events', requireSponsor, async (req, res) => {
    try {
        const events = getSponsorEvents()
        return res.json(events)
    } catch (error) {
        console.error('Error fetching sponsor events:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor events.' })
    }
})

// Event Details Endpoint
router.get('/events/:eventId', requireSponsor, async (req, res) => {
    try {
        const eventId = Number(req.params.eventId)
        const events = getSponsorEvents()
        const event = events.find((item) => Number(item.event_id ?? item.id) === eventId)

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' })
        }

        return res.json(event)
    } catch (error) {
        console.error('Error fetching sponsor event details:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor event details.' })
    }
})

router.get('/events/:eventId/packages', requireSponsor, async (req, res) => {
    try {
        const eventId = Number(req.params.eventId)
        const events = getSponsorEvents()
        const event = events.find((item) => Number(item.event_id ?? item.id) === eventId)

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' })
        }

        return res.json(getSponsorPackages(eventId))
    } catch (error) {
        console.error('Error fetching sponsor packages:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor packages.' })
    }
})

router.get('/events/:eventId/packages/:packageId', requireSponsor, async (req, res) => {
    try {
        const eventId = Number(req.params.eventId)
        const packageId = Number(req.params.packageId)
        const event = getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === eventId)

        if (!event) {
            return res.status(404).json({ message: 'Event not found.' })
        }

        const packages = getSponsorPackages(eventId)
        const selectedPackage = packages.find((item) => Number(item.package_id ?? item.id) === packageId)

        if (!selectedPackage) {
            return res.status(404).json({ message: 'Package not found.' })
        }

        return res.json({ event, package: selectedPackage })
    } catch (error) {
        console.error('Error fetching sponsor package details:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor package details.' })
    }
})

router.get('/sponsorships', requireSponsor, async (req, res) => {
    try {
        const proposals = readEntity('sponsorship_proposals', [])
        const approvedProposals = proposals
            .filter((item) => Number(item.sponsor_id) === Number(req.authSponsor.id) && String(item.status || '').trim().toLowerCase() === 'approved')
            .sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at))

        const payload = approvedProposals.map((proposal) => {
            const event = getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id)) || null
            const packageInfo = getSponsorPackages(Number(proposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(proposal.package_id)) || null
            const payment = readEntity('sponsorship_payments', []).find((item) => String(item.proposal_id) === String(proposal.proposal_id)) || null
            return {
                proposal_id: proposal.proposal_id,
                event_id: Number(proposal.event_id || 0),
                event_name: event?.name || 'Event Sponsorship',
                package_id: Number(proposal.package_id || 0),
                package_name: packageInfo?.label || 'Sponsorship Package',
                amount: Number(proposal.amount || 0),
                amount_label: `₹${Number(proposal.amount || 0).toLocaleString('en-IN')}`,
                status: proposal.status || 'Approved',
                payment_status: payment?.status || 'Pending',
                payment_tracking: payment,
                submitted_at: proposal.submitted_at || proposal.created_at,
            }
        })

        return res.json(payload)
    } catch (error) {
        console.error('Error fetching sponsor sponsorships:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor sponsorships.' })
    }
})

router.get('/payments', requireSponsor, async (req, res) => {
    try {
        const paymentRecords = readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === Number(req.authSponsor.id))
        const payload = paymentRecords.map((item) => ({
            ...item,
            total_amount: Number(item.amount || 0),
            paid_amount: Number(item.paid_amount || 0),
            due_amount: Number(item.due_amount || 0),
        }))

        const totalAmount = payload.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        const paidAmount = payload.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0)
        const dueAmount = payload.reduce((sum, item) => sum + Number(item.due_amount || 0), 0)

        return res.json({
            summary: {
                total: totalAmount,
                paid: paidAmount,
                due: dueAmount,
                pending_count: payload.filter((item) => Number(item.due_amount || 0) > 0).length,
            },
            records: payload,
        })
    } catch (error) {
        console.error('Error fetching sponsor payments:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor payments.' })
    }
})

router.post('/payments/:proposalId/pay', requireSponsor, async (req, res) => {
    try {
        const sponsorId = Number(req.authSponsor.id)
        const proposalId = String(req.params.proposalId)
        const requestedAmount = Number(req.body?.amount ?? req.body?.payment_amount ?? 0)
        const payment = markSponsorPaymentPaid(sponsorId, proposalId, requestedAmount)

        if (!payment || !payment.updated) {
            return res.status(404).json({ message: 'Payment record not found.' })
        }

        return res.json({
            message: 'Payment processed successfully.',
            payment: payment.payment,
        })
    } catch (error) {
        console.error('Error processing sponsor payment:', error)
        return res.status(500).json({ message: 'Failed to process sponsor payment.' })
    }
})

router.get('/deliverables', requireSponsor, async (req, res) => {
    try {
        const deliverables = readEntity('sponsorship_deliverables', []).filter((item) => Number(item.sponsor_id) === Number(req.authSponsor.id))
        return res.json({
            summary: {
                total: deliverables.length,
                completed: deliverables.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length,
                pending: deliverables.filter((item) => String(item.status || '').trim().toLowerCase() !== 'completed').length,
            },
            records: deliverables,
        })
    } catch (error) {
        console.error('Error fetching sponsor deliverables:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor deliverables.' })
    }
})

router.get('/performance', requireSponsor, async (req, res) => {
    try {
        const sponsorId = Number(req.authSponsor.id)
        const proposals = readEntity('sponsorship_proposals', [])
        const payments = readEntity('sponsorship_payments', [])
        const deliverables = readEntity('sponsorship_deliverables', [])

        const summary = buildSponsorPerformanceSummary(sponsorId, req.authSponsor, proposals, payments, deliverables)
        return res.json(summary)
    } catch (error) {
        console.error('Error fetching sponsor performance:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor performance metrics.' })
    }
})

router.get('/recommendations', requireSponsor, async (req, res) => {
    try {
        const sponsorId = Number(req.authSponsor.id)
        const proposals = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const payments = readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const deliverables = readEntity('sponsorship_deliverables', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const summary = generateSponsorRecommendations(sponsorId, req.authSponsor, proposals, payments, deliverables)
        return res.json(summary)
    } catch (error) {
        console.error('Error fetching sponsor recommendations:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor recommendations.' })
    }
})

router.get('/sponsorships/:proposalId/recommendations', requireSponsor, async (req, res) => {
    try {
        const sponsorId = Number(req.authSponsor.id)
        const proposalId = String(req.params.proposalId)
        const proposals = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const proposal = proposals.find((item) => String(item.proposal_id) === proposalId)

        if (!proposal) {
            return res.status(404).json({ message: 'Sponsor proposal not found.' })
        }

        const payments = readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const deliverables = readEntity('sponsorship_deliverables', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const summary = generateSponsorRecommendations(sponsorId, req.authSponsor, proposals, payments, deliverables)
        const proposalRecommendations = summary.recommendations.map((item) => ({
            ...item,
            sponsorship_id: proposal.proposal_id,
        }))

        return res.json({
            proposal_id: proposal.proposal_id,
            company_name: req.authSponsor.company_name,
            recommendations: proposalRecommendations,
            summary: `${req.authSponsor.company_name || 'Sponsor'} AI recommendations for ${proposal.proposal_id}`,
        })
    } catch (error) {
        console.error('Error fetching proposal recommendations:', error)
        return res.status(500).json({ message: 'Failed to fetch proposal recommendations.' })
    }
})

router.get('/reports/latest', requireSponsor, async (req, res) => {
    try {
        const sponsorId = Number(req.authSponsor.id)
        const proposals = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const proposal = proposals.filter((item) => String(item.status || '').trim().toLowerCase() === 'approved').sort((a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at))[0] || proposals[0] || null

        if (!proposal) {
            return res.json({ available: false, message: 'No approved sponsorship available for report generation.' })
        }

        const event = getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id)) || null
        const packageInfo = getSponsorPackages(Number(proposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(proposal.package_id)) || null
        const payments = readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const deliverables = readEntity('sponsorship_deliverables', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const paymentSummary = payments.length ? payments.reduce((acc, item) => {
            acc.total += Number(item.amount || 0)
            acc.paid += Number(item.paid_amount || 0)
            acc.due += Number(item.due_amount || 0)
            acc.pending_count += Number(item.due_amount || 0) > 0 ? 1 : 0
            return acc
        }, { total: 0, paid: 0, due: 0, pending_count: 0 }) : { total: Number(proposal.amount || 0), paid: 0, due: Number(proposal.amount || 0), pending_count: 1 }
        const deliverableSummary = {
            total: deliverables.length || 4,
            completed: deliverables.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length,
            pending: deliverables.filter((item) => String(item.status || '').trim().toLowerCase() !== 'completed').length,
            delayed: deliverables.filter((item) => String(item.status || '').trim().toLowerCase() === 'delayed').length,
            completion_rate: deliverables.length ? (deliverables.filter((item) => String(item.status || '').trim().toLowerCase() === 'completed').length / deliverables.length) * 100 : 0,
        }
        const engagementSummary = {
            booth_visits: 850,
            attendee_interactions: 620,
            leads: 450,
            qualified_leads: 87,
            converted_leads: 81,
            conversion_rate: 18,
        }
        const performanceSummary = {
            engagement_score: 92,
            satisfaction: 4.6,
            overall_performance: 92,
        }
        const recommendations = generateSponsorRecommendations(sponsorId, req.authSponsor, proposals, payments, deliverables).recommendations
        const report = buildSponsorPerformanceReport(sponsorId, req.authSponsor, {
            proposal_id: proposal.proposal_id,
            event_name: event?.name || 'Event Sponsorship',
            package_name: packageInfo?.label || 'Sponsorship Package',
            amount: Number(proposal.amount || 0),
            status: proposal.status || 'Approved',
        }, paymentSummary, deliverableSummary, engagementSummary, performanceSummary, recommendations)

        return res.json(report)
    } catch (error) {
        console.error('Error generating sponsor report:', error)
        return res.status(500).json({ message: 'Failed to generate sponsor performance report.' })
    }
})

router.get('/sponsorships/:proposalId/performance', requireSponsor, async (req, res) => {
    try {
        const sponsorId = Number(req.authSponsor.id)
        const proposalId = String(req.params.proposalId)
        const proposals = readEntity('sponsorship_proposals', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const proposal = proposals.find((item) => String(item.proposal_id) === proposalId)

        if (!proposal) {
            return res.status(404).json({ message: 'Sponsor proposal not found.' })
        }

        const payments = readEntity('sponsorship_payments', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const deliverables = readEntity('sponsorship_deliverables', []).filter((item) => Number(item.sponsor_id) === sponsorId)
        const summary = buildSponsorPerformanceSummary(sponsorId, req.authSponsor, proposals, payments, deliverables)

        return res.json({
            proposal_id: proposal.proposal_id,
            status: proposal.status,
            ...summary,
        })
    } catch (error) {
        console.error('Error fetching sponsorship performance detail:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsorship performance detail.' })
    }
})

router.post('/sponsorship-requirements', async (req, res) => {
    try {
        const sponsor = resolveSponsorFromRequest(req) || req.authSponsor
        if (!sponsor || String(sponsor.role || '').trim().toLowerCase() !== 'sponsor') {
            return res.status(403).json({ message: 'Sponsor access required.' })
        }

        const payload = {
            ...req.body,
            sponsor_id: Number(req.body?.sponsor_id ?? req.body?.sponsorId ?? sponsor.id ?? 0),
            event_id: Number(req.body?.event_id ?? req.body?.eventId ?? 0),
            package_id: Number(req.body?.package_id ?? req.body?.packageId ?? 0),
        }

        if (!payload.event_id || !payload.package_id) {
            return res.status(400).json({ message: 'Event and package selection are required.' })
        }

        const saved = saveSponsorshipRequirements(payload)
        return res.status(201).json(saved)
    } catch (error) {
        console.error('Error saving sponsor requirements:', error)
        return res.status(500).json({ message: 'Failed to save sponsorship requirements.' })
    }
})

router.post('/proposals', async (req, res) => {
    try {
        const sponsor = resolveSponsorFromRequest(req)
        if (!sponsor || String(sponsor.role || '').trim().toLowerCase() !== 'sponsor') {
            return res.status(403).json({ message: 'Sponsor access required.' })
        }

        const payload = {
            ...req.body,
            sponsor_id: Number(req.body?.sponsor_id ?? req.body?.sponsorId ?? sponsor.id ?? 0),
            event_id: Number(req.body?.event_id ?? req.body?.eventId ?? 0),
            package_id: Number(req.body?.package_id ?? req.body?.packageId ?? 0),
            requirement_id: Number(req.body?.requirement_id ?? req.body?.requirementId ?? 0),
            amount: Number(req.body?.amount ?? 0),
            status: String(req.body?.status || 'Pending Review').trim(),
            submitted_at: req.body?.submitted_at || new Date().toISOString(),
            booth_required: Boolean(req.body?.booth_required ?? req.body?.boothRequired ?? false),
            booth_preference: String(req.body?.booth_preference ?? req.body?.boothPreference ?? 'Not Required').trim(),
            branding_requirements: Array.isArray(req.body?.branding_requirements) ? req.body.branding_requirements : [],
            promotional_sessions: Number(req.body?.promotional_sessions ?? req.body?.promotionalSessions ?? 0),
            special_requirements: String(req.body?.special_requirements ?? req.body?.specialRequirements ?? '').trim(),
            notes: String(req.body?.notes ?? '').trim(),
        }

        if (!payload.event_id || !payload.package_id || !payload.amount) {
            return res.status(400).json({ message: 'Event, package, and amount are required.' })
        }

        const savedProposal = saveProposal(payload)

        const event = getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(savedProposal.event_id)) || null
        const packageInfo = getSponsorPackages(Number(savedProposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(savedProposal.package_id)) || null
        const sponsorRecord = readEntity('sponsors', []).find((item) => Number(item.id) === Number(savedProposal.sponsor_id)) || sponsor
        const analysis = analyzeProposal({
            proposal: savedProposal,
            sponsor: sponsorRecord,
            event,
            packageInfo,
        })

        const notifications = readEntity('notifications', [])
        notifications.unshift({
            id: nextId(notifications),
            recipient_email: sponsor.email,
            recipient_role: 'sponsor',
            title: 'Proposal submitted successfully',
            message: `Your sponsorship proposal ${savedProposal.proposal_id} has been submitted successfully. Status: Pending Review`,
            type: 'success',
            is_read: false,
            created_at: new Date().toISOString(),
            analysis_summary: {
                recommendation: analysis.recommendation,
                proposal_risk: analysis.proposal_risk,
                sponsor_score: analysis.sponsor_score,
            },
        })
        writeEntity('notifications', notifications)

        return res.status(201).json({
            ...savedProposal,
            ai_analysis: analysis,
        })
    } catch (error) {
        console.error('Error creating sponsor proposal:', error)
        return res.status(500).json({ message: 'Failed to create sponsorship proposal.' })
    }
})

router.get('/proposals', async (req, res) => {
    try {
        const email = String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase()
        const sponsor = findSponsorRecordByEmail(email)

        if (!sponsor || String(sponsor.role || '').trim().toLowerCase() !== 'sponsor') {
            return res.status(403).json({ message: 'Sponsor access required.' })
        }

        const sponsorProposals = getSponsorProposalsForAccount(sponsor)
        return res.json(sponsorProposals)
    } catch (error) {
        console.error('Error fetching sponsor proposals:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsorship proposals.' })
    }
})

router.get('/notifications', requireSponsor, async (req, res) => {
    try {
        const sponsor = req.authSponsor
        const notifications = readEntity('notifications', [])
            .filter((item) => {
                const recipientMatch = String(item.recipient_email || '').trim().toLowerCase() === String(sponsor.email || '').trim().toLowerCase()
                const sponsorRoleMatch = String(item.recipient_role || '').trim().toLowerCase() === 'sponsor'
                const sponsorIdMatch = Number(item.sponsor_id) === Number(sponsor.id)
                return recipientMatch || sponsorRoleMatch || sponsorIdMatch
            })
            .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))

        return res.json(notifications)
    } catch (error) {
        console.error('Error fetching sponsor notifications:', error)
        return res.status(500).json({ message: 'Failed to fetch sponsor notifications.' })
    }
})

router.get('/proposals/:proposalId', async (req, res) => {
    try {
        const email = String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase()
        const sponsor = findSponsorRecordByEmail(email)

        if (!sponsor || String(sponsor.role || '').trim().toLowerCase() !== 'sponsor') {
            return res.status(403).json({ message: 'Sponsor access required.' })
        }

        const proposal = readEntity('sponsorship_proposals', []).find((item) => String(item.proposal_id) === String(req.params.proposalId))
        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found.' })
        }

        if (Number(proposal.sponsor_id) !== Number(sponsor.id)) {
            return res.status(403).json({ message: 'You are not authorized to view this proposal.' })
        }

        const analysis = getProposalAnalysis(proposal.proposal_id)
        return res.json({
            ...proposal,
            ai_analysis: analysis,
        })
    } catch (error) {
        console.error('Error fetching sponsor proposal details:', error)
        return res.status(500).json({ message: 'Failed to fetch proposal details.' })
    }
})

router.get('/ai-analysis/:proposalId', async (req, res) => {
    try {
        const email = String(req.query.email || req.headers['x-user-email'] || '').trim().toLowerCase()
        const sponsor = findSponsorRecordByEmail(email)

        if (!sponsor || String(sponsor.role || '').trim().toLowerCase() !== 'sponsor') {
            return res.status(403).json({ message: 'Sponsor access required.' })
        }

        const targetProposalId = String(req.params.proposalId)
        const proposal = readEntity('sponsorship_proposals', []).find((item) => String(item.proposal_id) === targetProposalId)

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found.' })
        }

        if (Number(proposal.sponsor_id) !== Number(sponsor.id)) {
            return res.status(403).json({ message: 'You are not authorized to view this proposal analysis.' })
        }

        const analysis = getProposalAnalysis(targetProposalId)
        if (!analysis) {
            const event = getSponsorEvents().find((item) => Number(item.event_id ?? item.id) === Number(proposal.event_id)) || null
            const packageInfo = getSponsorPackages(Number(proposal.event_id)).find((item) => Number(item.package_id ?? item.id) === Number(proposal.package_id)) || null
            const sponsorRecord = sponsors.find((item) => Number(item.id) === Number(proposal.sponsor_id)) || sponsor
            const generated = analyzeProposal({ proposal, sponsor: sponsorRecord, event, packageInfo })
            return res.json(generated)
        }

        return res.json(analysis)
    } catch (error) {
        console.error('Error fetching AI sponsorship analysis:', error)
        return res.status(500).json({ message: 'Failed to fetch AI sponsorship analysis.' })
    }
})

module.exports = router
module.exports.findSponsorRecordByEmail = findSponsorRecordByEmail
module.exports.getAllSponsorAccounts = getAllSponsorAccounts
module.exports.getSponsorProposalsForAccount = getSponsorProposalsForAccount
module.exports.buildSponsorPerformanceSummary = buildSponsorPerformanceSummary
module.exports.generateSponsorRecommendations = generateSponsorRecommendations
module.exports.buildSponsorPerformanceReport = buildSponsorPerformanceReport
module.exports.markSponsorPaymentPaid = markSponsorPaymentPaid
module.exports.saveSponsorshipRequirements = saveSponsorshipRequirements
module.exports.saveProposal = saveProposal
module.exports.getProposalAnalysis = getProposalAnalysis
module.exports.getSponsorEvents = getSponsorEvents
module.exports.getSponsorPackages = getSponsorPackages
