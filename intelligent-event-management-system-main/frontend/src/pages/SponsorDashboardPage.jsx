import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
    LayoutDashboard,
    Calendar,
    FileText,
    Award,
    CreditCard,
    CheckSquare,
    TrendingUp,
    Bell,
    User,
    LogOut,
    Sparkles,
    Building2,
    Phone,
    Mail,
    Globe,
    Briefcase,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Menu,
    X,
    Edit3,
    Save,
    Clock,
    Zap,
} from 'lucide-react'
import Navbar from '../components/Navbar'

export default function SponsorDashboardPage() {
    const navigate = useNavigate()
    const initialTab = localStorage.getItem('eventai_sponsor_tab') || 'Dashboard'
    const [activeTab, setActiveTab] = useState(initialTab)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [loadingStats, setLoadingStats] = useState(true)
    const [stats, setStats] = useState(null)
    const [proposalList, setProposalList] = useState([])
    const [loadingProposals, setLoadingProposals] = useState(false)
    const [selectedProposalId, setSelectedProposalId] = useState('')
    const [sponsorshipData, setSponsorshipData] = useState([])
    const [paymentData, setPaymentData] = useState({ summary: { total: 0, paid: 0, due: 0, pending_count: 0 }, records: [] })
    const [deliverableData, setDeliverableData] = useState({ summary: { total: 0, completed: 0, pending: 0 }, records: [] })
    const [performanceData, setPerformanceData] = useState({ companyName: '', totalSponsorships: 0, approvedValue: 0, conversionRate: 0, completionRate: 0, paymentReliability: 0, engagementScore: 0, performanceStatus: 'No data', engagementBreakdown: [], dataAvailable: false })
    const [recommendationData, setRecommendationData] = useState({ sponsor_id: null, company_name: '', recommendations: [], summary: '' })
    const [reportData, setReportData] = useState(null)
    const [loadingSponsorshipData, setLoadingSponsorshipData] = useState(false)
    const [payingProposalId, setPayingProposalId] = useState('')
    const [paymentDrafts, setPaymentDrafts] = useState({})

    // Profile Form State
    const [profile, setProfile] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        industry: '',
        website: '',
        status: 'Active',
        logo: '',
    })
    const [notificationList, setNotificationList] = useState([])
    const [editingProfile, setEditingProfile] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)

    const currentUser = JSON.parse(localStorage.getItem('eventai_user') || '{}')

    useEffect(() => {
        const savedTab = localStorage.getItem('eventai_sponsor_tab') || 'Dashboard'
        setActiveTab(savedTab)
    }, [])

    // Fetch Dashboard Stats & Profile
    useEffect(() => {
        fetchSponsorData()
    }, [])

    useEffect(() => {
        if (activeTab === 'My Proposals') {
            fetchMyProposals()
        }

        if (['My Sponsorships', 'Payments', 'Deliverables'].includes(activeTab)) {
            fetchSponsorTracking()
        }

        if (activeTab === 'Performance') {
            fetchSponsorPerformance()
            fetchSponsorRecommendations()
        }

        if (activeTab === 'Reports') {
            fetchSponsorRecommendations()
            fetchSponsorReport()
        }

        if (activeTab === 'Notifications') {
            fetchSponsorNotifications()
        }
    }, [activeTab])

    const fetchSponsorNotifications = async () => {
        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }
            const response = await axios.get('/api/sponsor/notifications', { headers })
            setNotificationList(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error('Failed to load sponsor notifications:', error)
            setNotificationList([])
        }
    }

    const fetchSponsorData = async () => {
        setLoadingStats(true)
        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }

            const [statsRes, profileRes] = await Promise.allSettled([
                axios.get('/api/sponsor/dashboard-stats', { headers }),
                axios.get('/api/sponsor/profile', { headers }),
            ])

            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data)
            } else {
                // Fallback default statistics if API returns fallback
                setStats({
                    companyName: currentUser.company_name || 'ABC Technologies',
                    contactPerson: currentUser.contact_person || 'Sponsor Contact',
                    activeSponsorshipsCount: 2,
                    pendingProposalsCount: 1,
                    totalSponsorshipValue: '₹8,00,000',
                    pendingPayments: '₹2,00,000',
                    paymentSummary: { total: '₹8,00,000', paid: '₹6,00,000', pending: '₹2,00,000' },
                    deliverableProgress: { completed: 8, pending: 2, progress: 80 },
                    activeSponsorships: [
                        { id: 1, eventName: 'Tech Innovation Summit', tier: 'Platinum Sponsorship', amount: '₹5,00,000', status: 'Active' },
                    ],
                    pendingProposals: [
                        { id: 1, eventName: 'AI Future Conference', tier: 'Gold Sponsorship', amount: '₹3,00,000', status: 'Pending Review' },
                    ],
                    recentNotifications: [
                        { id: 1, text: '✓ Your sponsorship proposal was approved.', type: 'success' },
                        { id: 2, text: '✓ Payment received successfully.', type: 'success' },
                        { id: 3, text: '⚠ Social media promotion deliverable is pending.', type: 'warning' },
                    ],
                })
            }

            if (profileRes.status === 'fulfilled') {
                const p = profileRes.value.data
                setProfile({
                    companyName: p.company_name || currentUser.company_name || 'ABC Technologies',
                    contactPerson: p.contact_person || currentUser.contact_person || 'John Doe',
                    email: p.email || currentUser.email || '',
                    phone: p.phone || currentUser.phone || '',
                    industry: p.industry || currentUser.industry || 'Technology',
                    website: p.website || currentUser.website || 'https://abctech.example.com',
                    status: p.status || 'Active',
                    logo: p.logo || '',
                })
            } else {
                setProfile({
                    companyName: currentUser.company_name || 'ABC Technologies',
                    contactPerson: currentUser.contact_person || 'John Doe',
                    email: currentUser.email || 'sponsor@abctech.com',
                    phone: currentUser.phone || '+91 9876543210',
                    industry: currentUser.industry || 'Technology',
                    website: currentUser.website || 'https://abctech.example.com',
                    status: 'Active',
                    logo: '',
                })
            }
        } catch (error) {
            console.error('Failed to load sponsor data:', error)
        } finally {
            setLoadingStats(false)
        }
    }

    const fetchMyProposals = async () => {
        setLoadingProposals(true)
        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }
            const response = await axios.get('/api/sponsor/proposals', { headers })
            const proposals = Array.isArray(response.data) ? response.data : []
            setProposalList(proposals)
            if (proposals.length > 0 && !selectedProposalId) {
                setSelectedProposalId(proposals[0].proposal_id)
            }
            if (proposals.length === 0) {
                setSelectedProposalId('')
            }
        } catch (error) {
            console.error('Failed to load sponsor proposals:', error)
            setProposalList([])
            setSelectedProposalId('')
        } finally {
            setLoadingProposals(false)
        }
    }

    const normalizeRecords = (value, fallback = []) => {
        if (Array.isArray(value)) return value
        if (!value) return fallback
        if (Array.isArray(value.records)) return value.records
        if (typeof value === 'object') return [value]
        return fallback
    }

    const normalizePaymentSummary = (value) => ({
        total: Number(value?.total ?? value?.amount ?? 0),
        paid: Number(value?.paid ?? value?.paid_amount ?? 0),
        due: Number(value?.due ?? value?.due_amount ?? 0),
        pending_count: Number(value?.pending_count ?? 0),
    })

    const normalizeDeliverableSummary = (value) => ({
        total: Number(value?.total ?? 0),
        completed: Number(value?.completed ?? 0),
        pending: Number(value?.pending ?? 0),
    })

    const fetchSponsorPerformance = async () => {
        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }

            const response = await axios.get('/api/sponsor/performance', { headers })
            setPerformanceData(response.data || { companyName: '', totalSponsorships: 0, approvedValue: 0, conversionRate: 0, completionRate: 0, paymentReliability: 0, engagementScore: 0, performanceStatus: 'No data', engagementBreakdown: [], dataAvailable: false })
        } catch (error) {
            console.error('Failed to load sponsor performance data:', error)
            setPerformanceData({ companyName: profile.companyName || currentUser.company_name || 'Sponsor', totalSponsorships: 0, approvedValue: 0, conversionRate: 0, completionRate: 0, paymentReliability: 0, engagementScore: 0, performanceStatus: 'No data', engagementBreakdown: [], dataAvailable: false })
        }
    }

    const fetchSponsorRecommendations = async () => {
        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }
            const response = await axios.get('/api/sponsor/recommendations', { headers })
            setRecommendationData(response.data || { sponsor_id: null, company_name: profile.companyName || currentUser.company_name || 'Sponsor', recommendations: [], summary: '' })
        } catch (error) {
            console.error('Failed to load sponsor recommendations:', error)
            setRecommendationData({ sponsor_id: null, company_name: profile.companyName || currentUser.company_name || 'Sponsor', recommendations: [], summary: 'No AI recommendations are available yet.' })
        }
    }

    const fetchSponsorReport = async () => {
        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }
            const response = await axios.get('/api/sponsor/reports/latest', { headers })
            setReportData(response.data && response.data.available === false ? null : (response.data || null))
        } catch (error) {
            console.error('Failed to load sponsor report:', error)
            setReportData(null)
        }
    }

    const downloadReport = () => {
        if (!reportData || !reportData.summary) return
        const blob = new Blob([reportData.summary], { type: 'text/plain;charset=utf-8' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${(profile.companyName || currentUser.company_name || 'sponsor').replace(/\s+/g, '-').toLowerCase()}-performance-report.txt`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(link.href)
        toast.success('Sponsor performance report downloaded.')
    }

    const openPaymentInput = (entry) => {
        if (!entry || Number(entry.due_amount || 0) <= 0) {
            toast.error('No pending amount to pay.')
            return
        }

        setPaymentDrafts((prev) => ({
            ...prev,
            [entry.proposal_id]: String(Number(entry.due_amount || 0)),
        }))
    }

    const cancelPaymentDraft = (proposalId) => {
        setPaymentDrafts((prev) => {
            const next = { ...prev }
            delete next[proposalId]
            return next
        })
    }

    const handlePayNow = async (entry) => {
        if (!entry || Number(entry.due_amount || 0) <= 0) {
            toast.error('No pending amount to pay.')
            return
        }

        const draftAmount = Number(paymentDrafts[entry.proposal_id] ?? entry.due_amount ?? 0)

        if (!Number.isFinite(draftAmount) || draftAmount <= 0) {
            toast.error('Please enter a valid amount to continue.')
            return
        }

        if (draftAmount > Number(entry.due_amount || 0)) {
            toast.error(`Amount cannot exceed the due amount of ₹${Number(entry.due_amount || 0).toLocaleString('en-IN')}.`)
            return
        }

        if (payingProposalId && payingProposalId === entry.proposal_id) {
            return
        }

        setPayingProposalId(entry.proposal_id)

        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }
            await axios.post(`/api/sponsor/payments/${encodeURIComponent(entry.proposal_id)}/pay`, { amount: draftAmount }, { headers })
            toast.success('Payment recorded successfully.')
            cancelPaymentDraft(entry.proposal_id)
            fetchSponsorTracking()
            fetchSponsorPerformance()
        } catch (error) {
            console.error('Payment failed:', error)
            toast.error(error.response?.data?.message || 'Unable to process payment right now.')
        } finally {
            setPayingProposalId('')
        }
    }

    const fetchSponsorTracking = async () => {
        setLoadingSponsorshipData(true)
        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }

            const [sponsorshipRes, paymentsRes, deliverablesRes] = await Promise.allSettled([
                axios.get('/api/sponsor/sponsorships', { headers }),
                axios.get('/api/sponsor/payments', { headers }),
                axios.get('/api/sponsor/deliverables', { headers }),
            ])

            if (sponsorshipRes.status === 'fulfilled') {
                setSponsorshipData(normalizeRecords(sponsorshipRes.value.data, []))
            } else {
                setSponsorshipData([])
            }

            if (paymentsRes.status === 'fulfilled') {
                const paymentPayload = paymentsRes.value.data || { summary: { total: 0, paid: 0, due: 0, pending_count: 0 }, records: [] }
                setPaymentData({
                    summary: normalizePaymentSummary(paymentPayload.summary || paymentPayload),
                    records: normalizeRecords(paymentPayload.records || paymentPayload, []),
                })
            } else {
                setPaymentData({ summary: { total: 0, paid: 0, due: 0, pending_count: 0 }, records: [] })
            }

            if (deliverablesRes.status === 'fulfilled') {
                const deliverablePayload = deliverablesRes.value.data || { summary: { total: 0, completed: 0, pending: 0 }, records: [] }
                setDeliverableData({
                    summary: normalizeDeliverableSummary(deliverablePayload.summary || deliverablePayload),
                    records: normalizeRecords(deliverablePayload.records || deliverablePayload, []),
                })
            } else {
                setDeliverableData({ summary: { total: 0, completed: 0, pending: 0 }, records: [] })
            }
        } catch (error) {
            console.error('Failed to load sponsor tracking data:', error)
        } finally {
            setLoadingSponsorshipData(false)
        }
    }

    const selectedProposal = proposalList.find((proposal) => proposal.proposal_id === selectedProposalId) || proposalList[0] || null

    const handleTabChange = (tabName) => {
        setActiveTab(tabName)
        localStorage.setItem('eventai_sponsor_tab', tabName)
    }

    const handleLogout = () => {
        localStorage.removeItem('eventai_user')
        localStorage.removeItem('eventai_sponsor_tab')
        toast.success('Logged out successfully')
        navigate('/sponsor/login')
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const headers = {
                'x-user-role': 'sponsor',
                'x-user-email': currentUser.email || '',
            }
            await axios.put('/api/sponsor/profile', profile, { headers })
            toast.success('Sponsor profile updated successfully!')
            setEditingProfile(false)
            fetchSponsorData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setSavingProfile(false)
        }
    }

    const sidebarLinks = [
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'Browse Events', icon: Calendar },
        { name: 'My Proposals', icon: FileText },
        { name: 'My Sponsorships', icon: Award },
        { name: 'Payments', icon: CreditCard },
        { name: 'Deliverables', icon: CheckSquare },
        { name: 'Performance', icon: TrendingUp },
        { name: 'Reports', icon: FileText },
        { name: 'Notifications', icon: Bell },
        { name: 'Profile', icon: User },
    ]

    return (
        <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
            <Navbar />

            <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
                {/* Sidebar Desktop */}
                <aside className="hidden lg:flex flex-col w-64 glass rounded-3xl p-5 border border-purple-500/20 shrink-0 h-[calc(100vh-120px)] sticky top-24">
                    <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-purple-500/30">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center border border-purple-400/40 glow-purple shrink-0">
                            <Building2 size={20} className="text-purple-300" />
                        </div>
                        <div>
                            <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Sponsor Portal</div>
                            <div className="text-white font-bold text-sm truncate max-w-[140px]">
                                {profile.companyName || 'ABC Technologies'}
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                        {sidebarLinks.map((item) => {
                            const Icon = item.icon
                            const isActive = activeTab === item.name
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        if (item.name === 'Browse Events') {
                                            navigate('/sponsor/events')
                                            return
                                        }
                                        handleTabChange(item.name)
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                            ? 'bg-purple-600/30 text-white border border-purple-500/40 shadow-lg shadow-purple-900/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-purple-300' : 'text-slate-400'} />
                                    <span>{item.name}</span>
                                </button>
                            )
                        })}
                    </nav>

                    <div className="pt-4 border-t border-white/10 mt-auto">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Sidebar Mobile Toggle */}
                <div className="lg:hidden w-full flex items-center justify-between glass p-4 rounded-2xl border border-white/10 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center border border-purple-400/40">
                            <Building2 size={16} className="text-purple-300" />
                        </div>
                        <span className="font-orbitron font-bold text-sm text-white">Sponsor Portal</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 glass rounded-lg text-white"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Navigation Drawer */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="lg:hidden fixed inset-x-4 top-24 z-40 glass-dark rounded-3xl p-5 border border-purple-500/30 shadow-2xl space-y-2 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider px-3 mb-2">Navigation</div>
                            {sidebarLinks.map((item) => {
                                const Icon = item.icon
                                const isActive = activeTab === item.name
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => {
                                            if (item.name === 'Browse Events') {
                                                navigate('/sponsor/events')
                                                setSidebarOpen(false)
                                                return
                                            }
                                            handleTabChange(item.name)
                                            setSidebarOpen(false)
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                                ? 'bg-purple-600/40 text-white border border-purple-500/50'
                                                : 'text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon size={18} className={isActive ? 'text-purple-300' : 'text-slate-400'} />
                                        <span>{item.name}</span>
                                    </button>
                                )
                            })}
                            <div className="pt-3 border-t border-white/10 mt-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"
                                >
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className="flex-1 space-y-6">
                    {/* TAB 1: DASHBOARD HOME OVERVIEW */}
                    {activeTab === 'Dashboard' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* Header */}
                            <div className="glass rounded-3xl p-6 sm:p-8 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 mb-2">
                                        <Sparkles size={14} /> Sponsor Portal
                                    </div>
                                    <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-white">
                                        Welcome, {profile.companyName || 'ABC Technologies'}
                                    </h1>
                                    <p className="text-slate-400 text-sm mt-1">Sponsor Dashboard Overview</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Account Active
                                    </span>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="glass rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-400 text-xs font-medium">Active Sponsorships</span>
                                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                            <Award size={18} className="text-purple-300" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-white font-orbitron">
                                        {stats?.activeSponsorshipsCount ?? 2}
                                    </div>
                                    <div className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                                        <span>2 events ongoing</span>
                                    </div>
                                </div>

                                <div className="glass rounded-2xl p-5 border border-cyan-500/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-400 text-xs font-medium">AI Recommendations</span>
                                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                            <Sparkles size={18} className="text-cyan-300" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-white font-orbitron">{recommendationData.recommendations?.length || 0}</div>
                                    <button onClick={() => { handleTabChange('Performance'); }} className="mt-3 text-xs text-cyan-300 hover:text-cyan-200">View Recommendations</button>
                                </div>

                                <div className="glass rounded-2xl p-5 border border-emerald-500/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-400 text-xs font-medium">Reports</span>
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <FileText size={18} className="text-emerald-300" />
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-white font-orbitron">Latest Performance Report</div>
                                    <button onClick={() => { handleTabChange('Reports'); }} className="mt-3 text-xs text-emerald-300 hover:text-emerald-200">View Report</button>
                                </div>

                                <div className="glass rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-400 text-xs font-medium">Pending Proposals</span>
                                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                            <FileText size={18} className="text-cyan-300" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-white font-orbitron">
                                        {stats?.pendingProposalsCount ?? 1}
                                    </div>
                                    <div className="text-amber-400 text-xs mt-2 flex items-center gap-1">
                                        <span>1 proposal under review</span>
                                    </div>
                                </div>

                                <div className="glass rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-400 text-xs font-medium">Total Sponsorship Value</span>
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <TrendingUp size={18} className="text-emerald-300" />
                                        </div>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white font-orbitron">
                                        {stats?.totalSponsorshipValue || '₹8,00,000'}
                                    </div>
                                    <div className="text-slate-400 text-xs mt-2">Combined portfolio</div>
                                </div>

                                <div className="glass rounded-2xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-slate-400 text-xs font-medium">Pending Payments</span>
                                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                            <CreditCard size={18} className="text-amber-300" />
                                        </div>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold text-white font-orbitron text-amber-300">
                                        {stats?.pendingPayments || '₹2,00,000'}
                                    </div>
                                    <div className="text-amber-400/80 text-xs mt-2">Due upon milestone completion</div>
                                </div>
                            </div>

                            {/* Quick Actions Bar */}
                            <div className="glass rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider px-2">Quick Actions:</span>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={() => navigate('/sponsor/events')}
                                        className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"
                                    >
                                        <Calendar size={14} />
                                        Browse Events
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('My Proposals')}
                                        className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 border border-purple-500/30"
                                    >
                                        <FileText size={14} />
                                        My Proposals
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('My Sponsorships')}
                                        className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 border border-cyan-500/30"
                                    >
                                        <Award size={14} />
                                        My Sponsorships
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('Payments')}
                                        className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 border border-emerald-500/30"
                                    >
                                        <CreditCard size={14} />
                                        View Payments
                                    </button>
                                </div>
                            </div>

                            {/* Grid: Active Sponsorships & Pending Proposals */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Active Sponsorships Card */}
                                <div className="glass rounded-3xl p-6 border border-purple-500/20 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Award className="text-purple-300" size={20} />
                                                <h3 className="font-orbitron text-lg font-bold text-white">Active Sponsorships</h3>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                Status: Active
                                            </span>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 mb-4">
                                            <div className="text-white font-bold text-base">Tech Innovation Summit</div>
                                            <div className="text-purple-300 text-sm font-medium">Platinum Sponsorship</div>
                                            <div className="text-emerald-400 font-orbitron font-semibold text-lg">₹5,00,000</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleTabChange('My Sponsorships')}
                                        className="w-full btn-ghost rounded-xl py-2.5 text-xs font-semibold border border-purple-500/30 text-purple-300 hover:text-white flex items-center justify-center gap-2"
                                    >
                                        View Sponsorship
                                        <ArrowRight size={14} />
                                    </button>
                                </div>

                                {/* Pending Proposals Card */}
                                <div className="glass rounded-3xl p-6 border border-cyan-500/20 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <FileText className="text-cyan-300" size={20} />
                                                <h3 className="font-orbitron text-lg font-bold text-white">Pending Proposals</h3>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                Status: Pending Review
                                            </span>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 mb-4">
                                            <div className="text-white font-bold text-base">AI Future Conference</div>
                                            <div className="text-cyan-300 text-sm font-medium">Gold Sponsorship</div>
                                            <div className="text-emerald-400 font-orbitron font-semibold text-lg">₹3,00,000</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleTabChange('My Proposals')}
                                        className="w-full btn-ghost rounded-xl py-2.5 text-xs font-semibold border border-cyan-500/30 text-cyan-300 hover:text-white flex items-center justify-center gap-2"
                                    >
                                        View Proposal
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Grid: Payment Summary & Deliverable Progress */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Payment Summary */}
                                <div className="glass rounded-3xl p-6 border border-white/10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CreditCard className="text-emerald-400" size={20} />
                                        <h3 className="font-orbitron text-lg font-bold text-white">Payment Summary</h3>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <div className="text-slate-400 text-xs mb-1">Total Amount</div>
                                            <div className="text-white font-orbitron font-bold text-sm sm:text-base">₹8,00,000</div>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                            <div className="text-emerald-300 text-xs mb-1">Paid</div>
                                            <div className="text-emerald-400 font-orbitron font-bold text-sm sm:text-base">₹6,00,000</div>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                                            <div className="text-amber-300 text-xs mb-1">Pending</div>
                                            <div className="text-amber-400 font-orbitron font-bold text-sm sm:text-base">₹2,00,000</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deliverable Progress */}
                                <div className="glass rounded-3xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="text-purple-300" size={20} />
                                            <h3 className="font-orbitron text-lg font-bold text-white">Deliverable Progress</h3>
                                        </div>
                                        <span className="text-purple-300 font-orbitron font-bold text-sm">80%</span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
                                            <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500 w-[80%]"></div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 size={14} className="text-emerald-400" />
                                                <span>Completed: <strong className="text-white">8</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-amber-400" />
                                                <span>Pending: <strong className="text-white">2</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={14} className="text-purple-400" />
                                                <span>Progress: <strong className="text-white">80%</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Notifications Section */}
                            <div className="glass rounded-3xl p-6 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Bell className="text-purple-300" size={20} />
                                        <h3 className="font-orbitron text-lg font-bold text-white">Recent Notifications</h3>
                                    </div>
                                    <span className="text-xs text-slate-400">Real-time alerts</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-emerald-200">
                                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                        <span>Your sponsorship proposal was approved.</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-emerald-200">
                                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                        <span>Payment received successfully.</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-200">
                                        <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                                        <span>Social media promotion deliverable is pending.</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 2: PROFILE TAB */}
                    {activeTab === 'Profile' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 sm:p-8 border border-purple-500/20 flex items-center justify-between">
                                <div>
                                    <h1 className="font-orbitron text-2xl font-bold text-white">Sponsor Profile</h1>
                                    <p className="text-slate-400 text-xs mt-1">Manage your organization details and status</p>
                                </div>
                                {!editingProfile ? (
                                    <button
                                        onClick={() => setEditingProfile(true)}
                                        className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"
                                    >
                                        <Edit3 size={15} />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setEditingProfile(false)}
                                        className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>

                            <div className="glass rounded-3xl p-8 border border-white/10 shadow-xl">
                                {!editingProfile ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                                            <div className="w-16 h-16 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 font-orbitron font-bold text-2xl glow-purple">
                                                {profile.companyName ? profile.companyName.charAt(0).toUpperCase() : 'S'}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-white">{profile.companyName}</h2>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                                        Account Status: {profile.status}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Role: Sponsor</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <div className="text-xs text-slate-400 font-medium">Company Name</div>
                                                <div className="text-white font-semibold text-sm flex items-center gap-2">
                                                    <Building2 size={16} className="text-purple-300" />
                                                    {profile.companyName}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-xs text-slate-400 font-medium">Contact Person</div>
                                                <div className="text-white font-semibold text-sm flex items-center gap-2">
                                                    <User size={16} className="text-purple-300" />
                                                    {profile.contactPerson}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-xs text-slate-400 font-medium">Corporate Email</div>
                                                <div className="text-white font-semibold text-sm flex items-center gap-2">
                                                    <Mail size={16} className="text-purple-300" />
                                                    {profile.email}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-xs text-slate-400 font-medium">Phone Number</div>
                                                <div className="text-white font-semibold text-sm flex items-center gap-2">
                                                    <Phone size={16} className="text-purple-300" />
                                                    {profile.phone || 'Not specified'}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-xs text-slate-400 font-medium">Industry</div>
                                                <div className="text-white font-semibold text-sm flex items-center gap-2">
                                                    <Briefcase size={16} className="text-purple-300" />
                                                    {profile.industry || 'Not specified'}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-xs text-slate-400 font-medium">Website</div>
                                                <div className="text-white font-semibold text-sm flex items-center gap-2">
                                                    <Globe size={16} className="text-purple-300" />
                                                    {profile.website ? (
                                                        <a href={profile.website} target="_blank" rel="noreferrer" className="text-cyan-300 underline">
                                                            {profile.website}
                                                        </a>
                                                    ) : (
                                                        'Not specified'
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Company Name</label>
                                                <input
                                                    type="text"
                                                    value={profile.companyName}
                                                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                                                    className="input-glass w-full px-4 py-2.5 rounded-xl text-white text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Contact Person</label>
                                                <input
                                                    type="text"
                                                    value={profile.contactPerson}
                                                    onChange={(e) => setProfile({ ...profile, contactPerson: e.target.value })}
                                                    className="input-glass w-full px-4 py-2.5 rounded-xl text-white text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Phone</label>
                                                <input
                                                    type="text"
                                                    value={profile.phone}
                                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                    className="input-glass w-full px-4 py-2.5 rounded-xl text-white text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Industry</label>
                                                <input
                                                    type="text"
                                                    value={profile.industry}
                                                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                                                    className="input-glass w-full px-4 py-2.5 rounded-xl text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-slate-300 mb-1.5 block font-medium">Company Website</label>
                                            <input
                                                type="url"
                                                value={profile.website}
                                                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                                className="input-glass w-full px-4 py-2.5 rounded-xl text-white text-sm"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 pt-4">
                                            <button
                                                type="submit"
                                                disabled={savingProfile}
                                                className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center gap-2"
                                            >
                                                <Save size={15} />
                                                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingProfile(false)}
                                                className="btn-ghost rounded-xl px-4 py-2.5 text-xs font-semibold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'My Sponsorships' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <Award size={18} className="text-purple-300" />
                                    <h1 className="font-orbitron text-2xl font-bold text-white">My Sponsorships</h1>
                                </div>
                                <p className="text-slate-400 text-xs">Approved sponsorship records linked to your active commitments</p>
                            </div>

                            {loadingSponsorshipData ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">Loading sponsorships...</div>
                            ) : sponsorshipData.length === 0 ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">No approved sponsorships yet.</div>
                            ) : (
                                <div className="grid gap-4">
                                    {sponsorshipData.map((item) => (
                                        <div key={item.proposal_id} className="glass rounded-3xl p-5 border border-white/10">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                <div>
                                                    <div className="text-xs uppercase tracking-wider text-purple-300">{item.event_name}</div>
                                                    <h3 className="font-orbitron text-xl font-bold text-white mt-1">{item.package_name}</h3>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">{item.status}</span>
                                                    <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-300 text-[10px] font-semibold border border-white/10">{item.payment_status}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm text-slate-300">
                                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                                    <div className="text-slate-400 text-xs mb-1">Amount</div>
                                                    <div className="text-white font-semibold">{item.amount_label}</div>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                                    <div className="text-slate-400 text-xs mb-1">Proposal ID</div>
                                                    <div className="text-white font-semibold">{item.proposal_id}</div>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                                    <div className="text-slate-400 text-xs mb-1">Submitted</div>
                                                    <div className="text-white font-semibold">{new Date(item.submitted_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'Payments' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <CreditCard size={18} className="text-emerald-300" />
                                    <h1 className="font-orbitron text-2xl font-bold text-white">Payments</h1>
                                </div>
                                <p className="text-slate-400 text-xs">Track invoicing, payment status, and due amounts across approved sponsorships</p>
                            </div>

                            {!loadingSponsorshipData && (
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="glass rounded-2xl p-5 border border-white/10">
                                        <div className="text-slate-400 text-xs mb-2">Total</div>
                                        <div className="text-white font-orbitron text-2xl">₹{Number(paymentData.summary?.total || 0).toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="glass rounded-2xl p-5 border border-emerald-500/20">
                                        <div className="text-emerald-300 text-xs mb-2">Paid</div>
                                        <div className="text-emerald-400 font-orbitron text-2xl">₹{Number(paymentData.summary?.paid || 0).toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="glass rounded-2xl p-5 border border-amber-500/20">
                                        <div className="text-amber-300 text-xs mb-2">Due</div>
                                        <div className="text-amber-400 font-orbitron text-2xl">₹{Number(paymentData.summary?.due || 0).toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                            )}

                            {loadingSponsorshipData ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">Loading payment records...</div>
                            ) : paymentData.records.length === 0 ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">No payment records yet for approved sponsorships.</div>
                            ) : (
                                <div className="space-y-3">
                                    {paymentData.records.map((entry) => (
                                        <div key={entry.id} className="glass rounded-2xl p-4 border border-white/10">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div>
                                                    <div className="text-white font-semibold">{entry.proposal_id}</div>
                                                    <div className="text-slate-400 text-xs">{entry.status} • Due: ₹{Number(entry.due_amount || 0).toLocaleString('en-IN')}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="text-right">
                                                        <div className="text-slate-400 text-xs">Paid</div>
                                                        <div className="text-emerald-300 font-orbitron font-bold">₹{Number(entry.paid_amount || 0).toLocaleString('en-IN')}</div>
                                                    </div>
                                                    {Number(entry.due_amount || 0) > 0 && (
                                                        paymentDrafts[entry.proposal_id] !== undefined ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max={Number(entry.due_amount || 0)}
                                                                    value={paymentDrafts[entry.proposal_id] ?? ''}
                                                                    onChange={(event) => setPaymentDrafts((prev) => ({
                                                                        ...prev,
                                                                        [entry.proposal_id]: event.target.value,
                                                                    }))}
                                                                    className="w-28 rounded-xl border border-purple-500/30 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                                                    placeholder="Amount"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={payingProposalId === entry.proposal_id}
                                                                    onClick={() => handlePayNow(entry)}
                                                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${payingProposalId === entry.proposal_id
                                                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'}`}
                                                                >
                                                                    {payingProposalId === entry.proposal_id ? 'Processing...' : 'Confirm'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => cancelPaymentDraft(entry.proposal_id)}
                                                                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => openPaymentInput(entry)}
                                                                className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition"
                                                            >
                                                                Pay Now
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'Deliverables' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckSquare size={18} className="text-purple-300" />
                                    <h1 className="font-orbitron text-2xl font-bold text-white">Deliverables</h1>
                                </div>
                                <p className="text-slate-400 text-xs">Operational tasks and commitment tracking for approved sponsorships</p>
                            </div>

                            {!loadingSponsorshipData && (
                                <div className="glass rounded-2xl p-5 border border-white/10">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <div className="text-slate-400 text-xs">Progress</div>
                                            <div className="text-white font-orbitron text-2xl">{deliverableData.summary?.completed || 0}/{deliverableData.summary?.total || 0}</div>
                                        </div>
                                        <div className="text-purple-300 font-orbitron text-xl">{Math.round(((deliverableData.summary?.completed || 0) / Math.max(deliverableData.summary?.total || 1, 1)) * 100)}%</div>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round(((deliverableData.summary?.completed || 0) / Math.max(deliverableData.summary?.total || 1, 1)) * 100)}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {loadingSponsorshipData ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">Loading deliverables...</div>
                            ) : deliverableData.records.length === 0 ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">No deliverables scheduled yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {deliverableData.records.map((entry) => (
                                        <div key={entry.id} className="glass rounded-2xl p-4 border border-white/10">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div>
                                                    <div className="text-white font-semibold">{entry.title}</div>
                                                    <div className="text-slate-400 text-xs">{entry.proposal_id}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${String(entry.status || '').toLowerCase() === 'completed' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
                                                        {entry.status || 'Pending'}
                                                    </span>
                                                    <span className="text-slate-300 text-xs font-medium">{Number(entry.progress || 0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* OTHER TABS (Browse Events, My Proposals, My Sponsorships, Payments, Deliverables, Performance, Notifications) */}
                    {activeTab === 'My Proposals' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText size={18} className="text-purple-300" />
                                    <h1 className="font-orbitron text-2xl font-bold text-white">My Proposals</h1>
                                </div>
                                <p className="text-slate-400 text-xs">Current sponsorship submissions and status updates</p>
                            </div>

                            {loadingProposals ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">Loading proposals...</div>
                            ) : proposalList.length === 0 ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300">
                                        <FileText size={32} />
                                    </div>
                                    <h3 className="font-orbitron text-xl font-bold text-white">No proposals yet</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                                        Your submitted sponsorship proposals will appear here once you submit the first request.
                                    </p>
                                    <button
                                        onClick={() => navigate('/sponsor/events')}
                                        className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2"
                                    >
                                        <Calendar size={15} />
                                        Browse Events
                                    </button>
                                </div>
                            ) : (
                                <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
                                    <div className="glass rounded-3xl p-4 border border-white/10">
                                        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-300">Proposal List</div>
                                        <div className="space-y-3">
                                            {proposalList.map((proposal) => (
                                                <button
                                                    key={proposal.id}
                                                    onClick={() => setSelectedProposalId(proposal.proposal_id)}
                                                    className={`w-full text-left rounded-2xl border p-4 transition-all ${selectedProposal?.proposal_id === proposal.proposal_id
                                                            ? 'border-purple-500/50 bg-purple-500/10'
                                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <div className="text-white font-semibold">{proposal.proposal_id}</div>
                                                            <div className="text-xs text-slate-400 mt-1">{proposal.event_name || 'Event'} • {proposal.package_name || 'Package'}</div>
                                                        </div>
                                                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold border bg-slate-800/80 text-slate-200 border-white/10">
                                                            {proposal.status || 'Pending Review'}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 text-xs text-slate-300">
                                                        ₹{Number(proposal.amount || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="glass rounded-3xl p-6 border border-white/10">
                                        {selectedProposal ? (
                                            <>
                                                <div className="flex items-center justify-between gap-3 mb-5">
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wider text-purple-300">Proposal Details</div>
                                                        <h3 className="font-orbitron text-2xl text-white mt-1">{selectedProposal.proposal_id}</h3>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-amber-500/10 text-amber-300 border-amber-500/20">
                                                        {selectedProposal.status || 'Pending Review'}
                                                    </span>
                                                </div>

                                                <div className="space-y-3 text-sm text-slate-300">
                                                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                                        <span>Event</span>
                                                        <span className="text-white text-right">{selectedProposal.event_name || 'Tech Innovation Summit'}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                                        <span>Package</span>
                                                        <span className="text-white text-right">{selectedProposal.package_name || 'Platinum'}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                                        <span>Amount</span>
                                                        <span className="text-white text-right">₹{Number(selectedProposal.amount || 0).toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                                        <span>Submitted</span>
                                                        <span className="text-white text-right">{selectedProposal.submitted_at ? new Date(selectedProposal.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                                                    </div>
                                                    <div className="border-b border-white/10 pb-3">
                                                        <div className="mb-2 text-slate-400">Requirements</div>
                                                        <div className="text-white">{selectedProposal.special_requirements || 'No special requirements provided.'}</div>
                                                    </div>
                                                    {selectedProposal.booth_preference && (
                                                        <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                                            <span>Booth</span>
                                                            <span className="text-white text-right">{selectedProposal.booth_preference}</span>
                                                        </div>
                                                    )}
                                                    {selectedProposal.status && selectedProposal.status !== 'Pending Review' && (
                                                        <div className="pt-2 text-xs text-slate-400">
                                                            Status note: {selectedProposal.status}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-slate-400">Select a proposal to view details.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'Performance' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp size={18} className="text-purple-300" />
                                    <h1 className="font-orbitron text-2xl font-bold text-white">Sponsor Performance</h1>
                                </div>
                                <p className="text-slate-400 text-xs">Engagement tracking, payment reliability, and deliverable completion across active sponsorships</p>
                            </div>

                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="glass rounded-2xl p-5 border border-white/10">
                                    <div className="text-slate-400 text-xs mb-2">Sponsorships</div>
                                    <div className="text-white font-orbitron text-3xl">{performanceData.totalSponsorships ?? 0}</div>
                                </div>
                                <div className="glass rounded-2xl p-5 border border-emerald-500/20">
                                    <div className="text-emerald-300 text-xs mb-2">Approved Value</div>
                                    <div className="text-emerald-400 font-orbitron text-2xl">₹{Number(performanceData.approvedValue || 0).toLocaleString('en-IN')}</div>
                                </div>
                                <div className="glass rounded-2xl p-5 border border-cyan-500/20">
                                    <div className="text-cyan-300 text-xs mb-2">Conversion Rate</div>
                                    <div className="text-cyan-300 font-orbitron text-2xl">{Number(performanceData.conversionRate || 0).toFixed(1)}%</div>
                                </div>
                                <div className="glass rounded-2xl p-5 border border-purple-500/20">
                                    <div className="text-purple-300 text-xs mb-2">Engagement Score</div>
                                    <div className="text-purple-300 font-orbitron text-2xl">{Number(performanceData.engagementScore || 0)}/100</div>
                                </div>
                            </div>

                            <div className="glass rounded-3xl p-6 border border-white/10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={18} className="text-cyan-300" />
                                    <h3 className="font-orbitron text-xl text-white">AI Recommendations</h3>
                                </div>
                                {recommendationData.recommendations?.length ? (
                                    <div className="space-y-3">
                                        {recommendationData.recommendations.slice(0, 3).map((item) => (
                                            <div key={item.id || item.category} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <span className="text-xs uppercase tracking-wider text-cyan-300">{item.category}</span>
                                                    <span className={`px-2 py-1 text-[10px] rounded-full border ${item.priority === 'High' ? 'bg-red-500/10 text-red-300 border-red-500/30' : item.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                                                        {item.priority}
                                                    </span>
                                                </div>
                                                <div className="text-white font-semibold mb-2">{item.recommendation}</div>
                                                <div className="text-slate-400 text-sm mb-2">{item.reason}</div>
                                                <div className="text-slate-300 text-xs">{item.explanation}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-sm">No AI recommendation data is available yet for this sponsor.</div>
                                )}
                            </div>

                            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
                                <div className="glass rounded-3xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-orbitron text-xl text-white">Engagement Snapshot</h3>
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/20">{performanceData.performanceStatus || 'No data'}</span>
                                    </div>

                                    {performanceData.dataAvailable ? (
                                        <div className="space-y-4">
                                            {performanceData.engagementBreakdown?.map((metric) => (
                                                <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                    <div className="flex items-center justify-between gap-3 text-sm">
                                                        <span className="text-slate-300">{metric.label}</span>
                                                        <span className="text-white font-semibold">{metric.value}</span>
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-400">{metric.detail}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="glass rounded-2xl p-8 border border-dashed border-white/10 text-center text-slate-400">
                                            No sponsor engagement metrics are available yet.
                                        </div>
                                    )}
                                </div>

                                <div className="glass rounded-3xl p-6 border border-white/10">
                                    <h3 className="font-orbitron text-xl text-white mb-4">Performance Summary</h3>
                                    <div className="space-y-4 text-sm text-slate-300">
                                        <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                            <span>Approved Value</span>
                                            <span className="text-white">₹{Number(performanceData.approvedValue || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                            <span>Payment Reliability</span>
                                            <span className="text-white">{Number(performanceData.paymentReliability || 0)}%</span>
                                        </div>
                                        <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                                            <span>Deliverable Completion</span>
                                            <span className="text-white">{Number(performanceData.completionRate || 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between gap-4 pb-1">
                                            <span>Performance Status</span>
                                            <span className="text-white">{performanceData.performanceStatus || 'No data'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Reports' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 border border-purple-500/20 flex items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <FileText size={18} className="text-purple-300" />
                                        <h1 className="font-orbitron text-2xl font-bold text-white">Sponsor Performance Report</h1>
                                    </div>
                                    <p className="text-slate-400 text-xs">{profile.companyName || currentUser.company_name || 'Sponsor'} • Latest report summary</p>
                                </div>
                                <button onClick={downloadReport} className="btn-primary rounded-xl px-4 py-2 text-sm">Download Report</button>
                            </div>

                            {!reportData ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">No sponsor report is available yet.</div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="glass rounded-3xl p-6 border border-white/10">
                                        <div className="grid md:grid-cols-2 gap-5 text-sm text-slate-300">
                                            <div className="space-y-3">
                                                <div><span className="text-slate-400 block">Sponsor</span><span className="text-white font-semibold">{reportData.company_name || profile.companyName || currentUser.company_name || 'Sponsor'}</span></div>
                                                <div><span className="text-slate-400 block">Event</span><span className="text-white">{reportData.event_name || 'Tech Innovation Summit'}</span></div>
                                                <div><span className="text-slate-400 block">Package</span><span className="text-white">{reportData.package_name || 'Platinum'}</span></div>
                                            </div>
                                            <div className="space-y-3">
                                                <div><span className="text-slate-400 block">Sponsorship Value</span><span className="text-white font-semibold">₹{Number(reportData.sponsorship_value || 0).toLocaleString('en-IN')}</span></div>
                                                <div><span className="text-slate-400 block">Overall Performance</span><span className="text-white">{Number(reportData.performance?.overall_performance || 0)}%</span></div>
                                                <div><span className="text-slate-400 block">Payment Status</span><span className="text-white">{reportData.payment?.status || 'Pending'}</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid lg:grid-cols-2 gap-6">
                                        <div className="glass rounded-3xl p-5 border border-white/10">
                                            <h3 className="font-orbitron text-lg text-white mb-4">Sponsorship Summary</h3>
                                            <div className="space-y-3 text-sm text-slate-300">
                                                <div className="flex justify-between"><span>Event</span><span className="text-white">{reportData.event_name || 'N/A'}</span></div>
                                                <div className="flex justify-between"><span>Package</span><span className="text-white">{reportData.package_name || 'N/A'}</span></div>
                                                <div className="flex justify-between"><span>Sponsorship Value</span><span className="text-white">₹{Number(reportData.sponsorship_value || 0).toLocaleString('en-IN')}</span></div>
                                                <div className="flex justify-between"><span>Sponsorship Status</span><span className="text-white">{reportData.payment?.status || 'Active'}</span></div>
                                            </div>
                                        </div>
                                        <div className="glass rounded-3xl p-5 border border-white/10">
                                            <h3 className="font-orbitron text-lg text-white mb-4">Payment Summary</h3>
                                            <div className="space-y-3 text-sm text-slate-300">
                                                <div className="flex justify-between"><span>Total Amount</span><span className="text-white">₹{Number(reportData.payment?.total || 0).toLocaleString('en-IN')}</span></div>
                                                <div className="flex justify-between"><span>Paid</span><span className="text-white">₹{Number(reportData.payment?.paid || 0).toLocaleString('en-IN')}</span></div>
                                                <div className="flex justify-between"><span>Pending</span><span className="text-white">₹{Number(reportData.payment?.pending || 0).toLocaleString('en-IN')}</span></div>
                                                <div className="flex justify-between"><span>Payment Status</span><span className="text-white">{reportData.payment?.status || 'Pending'}</span></div>
                                            </div>
                                        </div>
                                        <div className="glass rounded-3xl p-5 border border-white/10">
                                            <h3 className="font-orbitron text-lg text-white mb-4">Deliverable Summary</h3>
                                            <div className="space-y-3 text-sm text-slate-300">
                                                <div className="flex justify-between"><span>Total Deliverables</span><span className="text-white">{reportData.deliverables?.total || 0}</span></div>
                                                <div className="flex justify-between"><span>Completed</span><span className="text-white">{reportData.deliverables?.completed || 0}</span></div>
                                                <div className="flex justify-between"><span>Pending</span><span className="text-white">{reportData.deliverables?.pending || 0}</span></div>
                                                <div className="flex justify-between"><span>Delayed</span><span className="text-white">{reportData.deliverables?.delayed || 0}</span></div>
                                                <div className="flex justify-between"><span>Completion Rate</span><span className="text-white">{Number(reportData.deliverables?.completion_rate || 0).toFixed(0)}%</span></div>
                                            </div>
                                        </div>
                                        <div className="glass rounded-3xl p-5 border border-white/10">
                                            <h3 className="font-orbitron text-lg text-white mb-4">Engagement Summary</h3>
                                            <div className="space-y-3 text-sm text-slate-300">
                                                <div className="flex justify-between"><span>Booth Visits</span><span className="text-white">{reportData.engagement?.booth_visits || 0}</span></div>
                                                <div className="flex justify-between"><span>Attendee Interactions</span><span className="text-white">{reportData.engagement?.attendee_interactions || 0}</span></div>
                                                <div className="flex justify-between"><span>Leads</span><span className="text-white">{reportData.engagement?.leads || 0}</span></div>
                                                <div className="flex justify-between"><span>Qualified Leads</span><span className="text-white">{reportData.engagement?.qualified_leads || 0}</span></div>
                                                <div className="flex justify-between"><span>Converted Leads</span><span className="text-white">{reportData.engagement?.converted_leads || 0}</span></div>
                                                <div className="flex justify-between"><span>Conversion Rate</span><span className="text-white">{Number(reportData.engagement?.conversion_rate || 0).toFixed(1)}%</span></div>
                                            </div>
                                        </div>
                                        <div className="glass rounded-3xl p-5 border border-white/10 md:col-span-2">
                                            <h3 className="font-orbitron text-lg text-white mb-4">Performance Summary</h3>
                                            <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
                                                <div><span className="text-slate-400 block">Engagement Score</span><span className="text-white font-semibold">{Number(reportData.performance?.engagement_score || 0)}%</span></div>
                                                <div><span className="text-slate-400 block">Satisfaction</span><span className="text-white font-semibold">{Number(reportData.performance?.satisfaction || 0).toFixed(1)} / 5</span></div>
                                                <div><span className="text-slate-400 block">Overall Performance</span><span className="text-white font-semibold">{Number(reportData.performance?.overall_performance || 0)}%</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass rounded-3xl p-5 border border-white/10">
                                        <h3 className="font-orbitron text-lg text-white mb-4">AI Recommendations</h3>
                                        {reportData.recommendations?.length ? (
                                            <div className="space-y-3">
                                                {reportData.recommendations.map((item) => (
                                                    <div key={item.id || item.category} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                        <div className="flex items-center justify-between gap-3 mb-2">
                                                            <span className="text-xs uppercase tracking-wider text-cyan-300">{item.category}</span>
                                                            <span className={`px-2 py-1 text-[10px] rounded-full border ${item.priority === 'High' ? 'bg-red-500/10 text-red-300 border-red-500/30' : item.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>{item.priority}</span>
                                                        </div>
                                                        <div className="text-white font-semibold mb-2">{item.recommendation}</div>
                                                        <div className="text-slate-400 text-sm">{item.reason}</div>
                                                        {item.explanation && <div className="text-slate-300 text-xs mt-2">{item.explanation}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-slate-400 text-sm">No recommendation data to display.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'Notifications' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <Bell size={18} className="text-purple-300" />
                                    <h1 className="font-orbitron text-2xl font-bold text-white">Notifications</h1>
                                </div>
                                <p className="text-slate-400 text-xs">Your sponsorship updates, approvals, and reminders</p>
                            </div>

                            {notificationList.length === 0 ? (
                                <div className="glass rounded-3xl p-12 border border-white/10 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300">
                                        <Bell size={32} />
                                    </div>
                                    <h3 className="font-orbitron text-xl font-bold text-white">No notifications yet</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                                        Approval updates, payment reminders, and proposal notifications will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {notificationList.map((note) => (
                                        <div key={note.id} className="glass rounded-3xl p-5 border border-white/10">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="text-white font-semibold text-base">{note.title || 'Sponsorship update'}</div>
                                                    <div className="text-slate-400 text-sm mt-1">{note.message || 'No message available.'}</div>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${String(note.type || '').toLowerCase() === 'success' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : String(note.type || '').toLowerCase() === 'danger' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'}`}>
                                                    {note.type || 'info'}
                                                </span>
                                            </div>
                                            <div className="text-slate-500 text-[11px] mt-3">
                                                {note.created_at ? new Date(note.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab !== 'Dashboard' && activeTab !== 'Profile' && activeTab !== 'My Proposals' && activeTab !== 'My Sponsorships' && activeTab !== 'Payments' && activeTab !== 'Deliverables' && activeTab !== 'Performance' && activeTab !== 'Reports' && activeTab !== 'Notifications' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div className="glass rounded-3xl p-6 border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <Sparkles size={18} className="text-purple-300" />
                                    <h1 className="font-orbitron text-2xl font-bold text-white">{activeTab}</h1>
                                </div>
                                <p className="text-slate-400 text-xs">
                                    Sponsor Portal — {activeTab} section view
                                </p>
                            </div>

                            <div className="glass rounded-3xl p-12 border border-white/10 text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300">
                                    <Award size={32} />
                                </div>
                                <h3 className="font-orbitron text-xl font-bold text-white">{activeTab} Section Active</h3>
                                <p className="text-slate-400 text-sm max-w-md mx-auto">
                                    You are viewing the {activeTab} section for <strong>{profile.companyName}</strong>. Further sponsorship agent workflows will build directly upon this portal.
                                </p>
                                <button
                                    onClick={() => handleTabChange('Dashboard')}
                                    className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2"
                                >
                                    <LayoutDashboard size={15} />
                                    Return to Dashboard Overview
                                </button>
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    )
}
