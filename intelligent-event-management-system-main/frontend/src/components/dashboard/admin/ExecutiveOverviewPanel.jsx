import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
    ShieldCheck,
    AlertTriangle,
    Users,
    Building2,
    CalendarDays,
    QrCode,
    Handshake,
    TrendingUp,
    BrainCircuit,
    Activity,
    CheckCircle2,
    RefreshCw,
    Award,
    Zap,
    ChevronDown,
    Clock,
    Flame,
    ArrowUpRight,
    PieChart as PieIcon,
    Sparkles,
    Layers,
    Percent
} from 'lucide-react'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'

const panelStyles = 'glass rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-slate-900/60'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function ExecutiveOverviewPanel() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedEventId, setSelectedEventId] = useState('all')
    const [refreshing, setRefreshing] = useState(false)

    const fetchOverview = async (eventId = selectedEventId) => {
        try {
            setRefreshing(true)
            const userStr = localStorage.getItem('eventai_user')
            let role = 'admin'
            let email = 'admin@eventai.local'
            if (userStr) {
                try {
                    const parsed = JSON.parse(userStr)
                    if (parsed?.role) role = parsed.role
                    if (parsed?.email) email = parsed.email
                } catch (e) { }
            }
            const headers = {
                'x-user-role': role,
                'x-user-email': email
            }
            const url = eventId && eventId !== 'all'
                ? `/api/admin/executive-overview/${eventId}`
                : '/api/admin/executive-overview'
            const response = await axios.get(url, { headers })
            setData(response.data)
            setError('')
        } catch (err) {
            console.error('Failed to load executive overview', err)
            setError('Unable to load executive dashboard data. Please try again.')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchOverview(selectedEventId)
        const interval = setInterval(() => {
            fetchOverview(selectedEventId)
        }, 15000)
        return () => clearInterval(interval)
    }, [selectedEventId])

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <RefreshCw className="animate-spin text-purple-400 mb-3" size={32} />
                <p className="text-sm font-medium">Aggregating Executive Intelligence...</p>
            </div>
        )
    }

    if (error && !data) {
        return (
            <div className="glass rounded-3xl p-8 border border-red-500/30 text-center text-red-300 my-6">
                <AlertTriangle className="mx-auto mb-3 text-red-400" size={36} />
                <h3 className="text-lg font-semibold mb-2">Executive Data Unavailable</h3>
                <p className="text-sm text-slate-400 mb-4">{error}</p>
                <button onClick={() => fetchOverview(selectedEventId)} className="btn-primary rounded-xl px-4 py-2 text-sm text-white">
                    Retry Connection
                </button>
            </div>
        )
    }

    const {
        selectedEventName,
        eventsList = [],
        eventOverview = {},
        eventHealth = {},
        speakerPerformance = {},
        sponsorPerformance = {},
        venuePerformance = {},
        incidents = {},
        aiInsights = {},
        visualizations = {}
    } = data || {}

    const healthColorMap = {
        GOOD: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        WARNING: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', text: 'text-amber-400', border: 'border-amber-500/30' },
        CRITICAL: { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', text: 'text-rose-400', border: 'border-rose-500/30' },
    }
    const healthStyle = healthColorMap[eventHealth.status] || healthColorMap.GOOD

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0)
    }

    return (
        <div className="space-y-8">
            {/* Top Header & Event Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                            <Sparkles size={12} /> Milestone 4 — Executive Operations Intelligence
                        </span>
                    </div>
                    <h1 className="font-orbitron text-3xl font-bold gradient-text">Executive Dashboard</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Real-time strategic decision support for senior event leaders & stakeholders
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Event Filter */}
                    <div className="relative">
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="appearance-none bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-white focus:outline-none focus:border-purple-500 transition cursor-pointer"
                        >
                            <option value="all">🌍 All Events Overview</option>
                            {eventsList.map((event) => (
                                <option key={event.event_id} value={event.event_id}>
                                    {event.name} ({event.status})
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => fetchOverview(selectedEventId)}
                        disabled={refreshing}
                        className="btn-ghost rounded-xl px-4 py-2.5 text-sm text-slate-300 border border-white/10 flex items-center gap-2 hover:bg-white/5 transition"
                    >
                        <RefreshCw size={15} className={refreshing ? 'animate-spin text-purple-400' : ''} />
                        <span>{refreshing ? 'Refreshing...' : 'Live Sync'}</span>
                    </button>
                </div>
            </div>

            {/* SECTION 1: 8 Executive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                {/* 1. Event Health */}
                <KpiCard
                    label="Event Health"
                    value={eventHealth.status || 'GOOD'}
                    subtext={`Score: ${eventHealth.score || 92}/100`}
                    icon={Activity}
                    badgeStyle={healthStyle.badge}
                    isStatus
                />
                {/* 2. Registrations */}
                <KpiCard
                    label="Registrations"
                    value={(eventOverview.totalRegistrations || 0).toLocaleString()}
                    subtext={`Confirmed: ${(eventOverview.confirmedAttendees || 0).toLocaleString()}`}
                    icon={Users}
                    accentColor="#8b5cf6"
                />
                {/* 3. Check-ins */}
                <KpiCard
                    label="Check-ins"
                    value={(eventOverview.checkIns || 0).toLocaleString()}
                    subtext={`Conducted: ${eventOverview.sessionsConducted || 0} sessions`}
                    icon={QrCode}
                    accentColor="#22d3ee"
                />
                {/* 4. Attendance Rate */}
                <KpiCard
                    label="Attendance Rate"
                    value={`${eventOverview.attendanceRate || 84}%`}
                    subtext={`Completion: ${eventOverview.completionPercentage || 78}%`}
                    icon={Percent}
                    accentColor="#10b981"
                />
                {/* 5. Sponsors */}
                <KpiCard
                    label="Sponsors"
                    value={sponsorPerformance.sponsorCount || 0}
                    subtext={formatCurrency(sponsorPerformance.sponsorshipRevenue)}
                    icon={Handshake}
                    accentColor="#f59e0b"
                />
                {/* 6. Open Incidents */}
                <KpiCard
                    label="Open Incidents"
                    value={incidents.openIncidents || 0}
                    subtext={`High Priority: ${incidents.highPriorityIncidents || 0}`}
                    icon={AlertTriangle}
                    accentColor={incidents.openIncidents > 0 ? '#f97316' : '#10b981'}
                />
                {/* 7. Critical Incidents */}
                <KpiCard
                    label="Critical Incidents"
                    value={incidents.criticalIncidents || 0}
                    subtext={`Active Alerts: ${incidents.activeAlerts || 0}`}
                    icon={Flame}
                    accentColor={incidents.criticalIncidents > 0 ? '#ef4444' : '#10b981'}
                    isAlert={incidents.criticalIncidents > 0}
                />
                {/* 8. Sponsor ROI */}
                <KpiCard
                    label="Sponsor ROI"
                    value={`${sponsorPerformance.sponsorRoi || 38}%`}
                    subtext={`Conversion: ${sponsorPerformance.conversionRate || 18}%`}
                    icon={TrendingUp}
                    accentColor="#ec4899"
                />
            </div>

            {/* SECTION 2: Prominent Event Health Indicator & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${panelStyles} lg:col-span-2 border-t-4 border-t-purple-500`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Overall Operational Status</span>
                            <h2 className="text-white text-xl font-bold font-orbitron flex items-center gap-2 mt-1">
                                Event Health Index
                            </h2>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full font-orbitron font-bold text-sm border ${healthStyle.badge}`}>
                            {eventHealth.status} ({eventHealth.score}/100)
                        </div>
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
                        {eventHealth.reason}
                    </p>

                    {/* Health Dimensions Progress Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <HealthDimensionBar label="Registration" score={eventOverview.attendanceRate || 84} color="#8b5cf6" />
                        <HealthDimensionBar label="Attendance" score={eventOverview.attendanceRate || 84} color="#06b6d4" />
                        <HealthDimensionBar label="Incidents" score={100 - (incidents.openIncidents * 15)} color="#10b981" />
                        <HealthDimensionBar label="Sponsorship" score={sponsorPerformance.sponsorEngagement || 82} color="#f59e0b" />
                        <HealthDimensionBar label="Operations" score={100 - (incidents.criticalIncidents * 25)} color="#ec4899" />
                    </div>
                </div>

                {/* Quick Executive Incident & Risk Summary */}
                <div className={panelStyles}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold font-orbitron flex items-center gap-2">
                            <ShieldCheck className="text-cyan-400" size={18} /> Incident & Risk Status
                        </h3>
                        <span className="text-xs text-slate-400">Live Telemetry</span>
                    </div>

                    <div className="space-y-3">
                        <RiskMetricRow label="Open Incidents" count={incidents.openIncidents} color="text-amber-400" bg="bg-amber-500/10 border-amber-500/20" />
                        <RiskMetricRow label="Critical Priority Incidents" count={incidents.criticalIncidents} color="text-rose-400" bg="bg-rose-500/10 border-rose-500/20" isCritical />
                        <RiskMetricRow label="High Priority Incidents" count={incidents.highPriorityIncidents} color="text-orange-400" bg="bg-orange-500/10 border-orange-500/20" />
                        <RiskMetricRow label="Active Operational Alerts" count={incidents.activeAlerts} color="text-purple-400" bg="bg-purple-500/10 border-purple-500/20" />
                    </div>
                </div>
            </div>

            {/* SECTION 3: Performance Columns (Speaker, Sponsor, Venue) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Speaker Performance */}
                <div className={panelStyles}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold font-orbitron flex items-center gap-2">
                            <Users className="text-purple-400" size={18} /> Speaker Performance
                        </h3>
                        <span className="text-xs text-purple-300 font-mono">Real-time</span>
                    </div>
                    <div className="space-y-4">
                        <MetricLine label="Sessions Conducted" value={`${speakerPerformance.sessionsConducted || 0} / ${speakerPerformance.totalSessions || 42}`} />
                        <MetricLine label="Speaker Participation" value={`${speakerPerformance.speakerParticipation || 91}%`} />
                        <MetricLine label="Average Session Rating" value={`${speakerPerformance.averageRating || 4.7} / 5.0`} />
                        <MetricLine label="Audience Engagement" value={`${speakerPerformance.audienceEngagement || 87}%`} />
                        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10 mt-2">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${speakerPerformance.audienceEngagement || 87}%` }} />
                        </div>
                    </div>
                </div>

                {/* Sponsor Performance */}
                <div className={panelStyles}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold font-orbitron flex items-center gap-2">
                            <Handshake className="text-amber-400" size={18} /> Sponsor Performance
                        </h3>
                        <span className="text-xs text-amber-300 font-mono">Financial</span>
                    </div>
                    <div className="space-y-4">
                        <MetricLine label="Total Sponsors" value={sponsorPerformance.sponsorCount || 0} />
                        <MetricLine label="Sponsorship Revenue" value={formatCurrency(sponsorPerformance.sponsorshipRevenue)} highlight />
                        <MetricLine label="Deliverables Engagement" value={`${sponsorPerformance.sponsorEngagement || 82}%`} />
                        <MetricLine label="Leads Generated" value={(sponsorPerformance.leadsGenerated || 1240).toLocaleString()} />
                        <MetricLine label="Lead Conversion Rate" value={`${sponsorPerformance.conversionRate || 18}%`} />
                        <MetricLine label="Average Sponsor ROI" value={`${sponsorPerformance.sponsorRoi || 38}%`} />
                    </div>
                </div>

                {/* Venue Performance */}
                <div className={panelStyles}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold font-orbitron flex items-center gap-2">
                            <Building2 className="text-emerald-400" size={18} /> Venue Performance
                        </h3>
                        <span className="text-xs text-emerald-300 font-mono">Spatial</span>
                    </div>
                    <div className="space-y-4">
                        <MetricLine label="Venue Utilization" value={`${venuePerformance.venueUtilization || 88}%`} />
                        <MetricLine label="Hall Occupancy Rate" value={`${venuePerformance.hallOccupancy || 82}%`} />
                        <MetricLine label="Capacity Utilization" value={`${venuePerformance.capacityUtilization || 84}%`} />
                        <MetricLine label="Session Attendance" value={(venuePerformance.sessionAttendance || 4200).toLocaleString()} />
                        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10 mt-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: `${venuePerformance.capacityUtilization || 84}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 4: AI Insights & Strategic Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Predicted Risks & Recommendations */}
                <div className={panelStyles}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold font-orbitron flex items-center gap-2">
                            <BrainCircuit className="text-cyan-400" size={20} /> AI Event Intelligence Insights
                        </h3>
                        <span className="badge">AI Engine v4</span>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <h4 className="text-cyan-300 text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                                <Zap size={14} /> Predicted Risks
                            </h4>
                            <ul className="space-y-2">
                                {aiInsights.predictedRisks?.slice(0, 3).map((risk, idx) => (
                                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                        <span className="text-amber-400 mt-1">▸</span>
                                        <div>
                                            <span className="font-semibold text-white">{risk.title || 'Operational Risk'}: </span>
                                            <span className="text-slate-400">{risk.description}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <h4 className="text-emerald-300 text-xs uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                                <CheckCircle2 size={14} /> Recommended Executive Actions
                            </h4>
                            <ul className="space-y-2">
                                {aiInsights.recommendedActions?.slice(0, 3).map((rec, idx) => (
                                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                        <span className="text-emerald-400 mt-1">✓</span>
                                        <div>
                                            <span className="font-semibold text-white">{rec.title || 'Action Item'}: </span>
                                            <span className="text-slate-400">{rec.action || rec.description}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Performance Trends Direction Cards */}
                <div className={panelStyles}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold font-orbitron flex items-center gap-2">
                            <TrendingUp className="text-purple-400" size={20} /> Performance Trends Matrix
                        </h3>
                        <span className="text-xs text-slate-400">Directional Telemetry</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {aiInsights.performanceTrends?.map((item, idx) => (
                            <div key={idx} className="p-4 rounded-2xl border border-white/10 bg-white/5">
                                <div className="text-xs text-slate-400 font-medium">{item.category}</div>
                                <div className="text-sm font-semibold text-white mt-1 flex items-center justify-between">
                                    <span>{item.metricName}</span>
                                    <span className={`text-base font-bold font-orbitron ${item.direction === '↑' ? 'text-emerald-400' : item.direction === '↓' ? 'text-rose-400' : 'text-cyan-400'}`}>
                                        {item.direction}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-2 font-mono">{item.trend || 'STABLE'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION 5: Visualizations & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration & Check-in Trend Chart */}
                <div className={panelStyles}>
                    <h3 className="text-white font-semibold font-orbitron mb-4 flex items-center gap-2">
                        <Layers className="text-purple-400" size={18} /> Registration & Check-in Velocity
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visualizations.registrationTrend || []}>
                                <defs>
                                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="checkGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                                <Legend />
                                <Area type="monotone" dataKey="registrations" stroke="#8b5cf6" fillOpacity={1} fill="url(#regGrad)" name="Registrations" />
                                <Area type="monotone" dataKey="checkIns" stroke="#06b6d4" fillOpacity={1} fill="url(#checkGrad)" name="Check-ins" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Venue Capacity Utilization Breakdown */}
                <div className={panelStyles}>
                    <h3 className="text-white font-semibold font-orbitron mb-4 flex items-center gap-2">
                        <Building2 className="text-emerald-400" size={18} /> Venue Utilization Overview
                    </h3>
                    <div className="space-y-3">
                        {venuePerformance.venues?.slice(0, 4).map((v) => (
                            <div key={v.venue_id} className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-white">{v.name}</div>
                                    <div className="text-xs text-slate-400">{v.location} • Capacity: {v.capacity}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-orbitron font-bold text-emerald-400">{v.utilization}%</div>
                                    <div className="text-xs text-slate-400">Utilization</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ label, value, subtext, icon: Icon, accentColor, badgeStyle, isStatus, isAlert }) {
    return (
        <motion.div
            whileHover={{ y: -3 }}
            className={`glass rounded-2xl p-4 border ${isAlert ? 'border-rose-500/50 bg-rose-500/10' : 'border-white/10'} transition relative overflow-hidden`}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium truncate">{label}</span>
                {Icon && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accentColor ? `${accentColor}22` : '#ffffff10' }}>
                        <Icon size={16} style={{ color: accentColor || '#a78bfa' }} />
                    </div>
                )}
            </div>

            {isStatus ? (
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-orbitron font-bold border ${badgeStyle}`}>
                    {value}
                </div>
            ) : (
                <div className="text-xl font-orbitron font-bold text-white truncate">{value}</div>
            )}

            {subtext && <div className="text-[11px] text-slate-400 mt-1 truncate">{subtext}</div>}
        </motion.div>
    )
}

function HealthDimensionBar({ label, score, color }) {
    return (
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
            <div className="text-xs text-slate-400 mb-1">{label}</div>
            <div className="text-lg font-orbitron font-bold text-white mb-2">{score}%</div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
            </div>
        </div>
    )
}

function RiskMetricRow({ label, count, color, bg, isCritical }) {
    return (
        <div className={`p-3 rounded-2xl border flex items-center justify-between ${bg}`}>
            <span className="text-sm font-medium text-slate-300">{label}</span>
            <span className={`text-base font-orbitron font-bold ${color} ${isCritical && count > 0 ? 'animate-pulse' : ''}`}>
                {count}
            </span>
        </div>
    )
}

function MetricLine({ label, value, highlight }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{label}</span>
            <span className={`font-semibold font-mono ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}</span>
        </div>
    )
}
