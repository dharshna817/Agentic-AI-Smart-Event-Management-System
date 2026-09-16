import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, UserCheck, Clock, QrCode, TrendingUp, Brain,
  Download, RefreshCw, Search, Filter, ChevronDown,
  Zap, AlertTriangle, Star, Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'

// ─── Demo Data ────────────────────────────────────────────────────────────────
const demoRegistrations = [
  { _id: '1', registrationId: 'EVT-2025-A1B2', fullName: 'Priya Sharma', email: 'priya@example.com', gender: 'Female', department: 'Computer Science', occupation: 'Student', city: 'Bangalore', checkedIn: true, createdAt: new Date().toISOString() },
  { _id: '2', registrationId: 'EVT-2025-C3D4', fullName: 'Rahul Mehta', email: 'rahul@example.com', gender: 'Male', department: 'Engineering', occupation: 'Software Engineer', city: 'Mumbai', checkedIn: false, createdAt: new Date().toISOString() },
  { _id: '3', registrationId: 'EVT-2025-E5F6', fullName: 'Ananya Krishnan', email: 'ananya@example.com', gender: 'Female', department: 'Design', occupation: 'Designer', city: 'Chennai', checkedIn: true, createdAt: new Date().toISOString() },
  { _id: '4', registrationId: 'EVT-2025-G7H8', fullName: 'Dev Patel', email: 'dev@example.com', gender: 'Male', department: 'Management', occupation: 'Manager', city: 'Ahmedabad', checkedIn: false, createdAt: new Date().toISOString() },
  { _id: '5', registrationId: 'EVT-2025-I9J0', fullName: 'Sara Johnson', email: 'sara@example.com', gender: 'Female', department: 'Research', occupation: 'Researcher', city: 'Delhi', checkedIn: true, createdAt: new Date().toISOString() },
  { _id: '6', registrationId: 'EVT-2025-K1L2', fullName: 'Karthik Rajan', email: 'karthik@example.com', gender: 'Male', department: 'Computer Science', occupation: 'Student', city: 'Hyderabad', checkedIn: false, createdAt: new Date().toISOString() },
  { _id: '7', registrationId: 'EVT-2025-M3N4', fullName: 'Meera Iyer', email: 'meera@example.com', gender: 'Female', department: 'Data Science', occupation: 'Data Scientist', city: 'Pune', checkedIn: true, createdAt: new Date().toISOString() },
  { _id: '8', registrationId: 'EVT-2025-O5P6', fullName: 'Arjun Singh', email: 'arjun@example.com', gender: 'Male', department: 'Engineering', occupation: 'Student', city: 'Jaipur', checkedIn: false, createdAt: new Date().toISOString() },
]

const timelineData = [
  { time: '6AM', registrations: 12 }, { time: '8AM', registrations: 45 },
  { time: '10AM', registrations: 89 }, { time: '12PM', registrations: 156 },
  { time: '2PM', registrations: 234 }, { time: '4PM', registrations: 312 },
  { time: '6PM', registrations: 398 }, { time: '8PM', registrations: 445 },
  { time: '10PM', registrations: 467 },
]

const genderData = [
  { name: 'Male', value: 54, color: '#6366f1' },
  { name: 'Female', value: 40, color: '#a855f7' },
  { name: 'Other', value: 6, color: '#06b6d4' },
]

const deptData = [
  { dept: 'CS/IT', count: 38 },
  { dept: 'Engineering', count: 22 },
  { dept: 'Design', count: 15 },
  { dept: 'Management', count: 12 },
  { dept: 'Data Science', count: 8 },
  { dept: 'Others', count: 5 },
]

const ageData = [
  { range: '18-21', count: 28 }, { range: '22-25', count: 42 },
  { range: '26-30', count: 19 }, { range: '31-40', count: 8 },
  { range: '40+', count: 3 },
]

const cityData = [
  { city: 'Bangalore', count: 245 }, { city: 'Mumbai', count: 187 },
  { city: 'Delhi', count: 156 }, { city: 'Hyderabad', count: 134 },
  { city: 'Chennai', count: 89 }, { city: 'Pune', count: 67 },
]

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-xl p-3 border border-purple-500/20 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-white font-bold">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, glow }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      className="glass rounded-2xl p-5 stat-card relative overflow-hidden"
      style={{ borderColor: glow + '33' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${glow}33, ${glow}11)`, border: `1px solid ${glow}44` }}
        >
          <Icon size={18} style={{ color: glow }} />
        </div>
        <TrendingUp size={14} className="text-emerald-400" />
      </div>
      <div className="font-orbitron text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-slate-400 text-xs">{label}</div>
      {sub && <div className="text-emerald-400 text-xs mt-1">{sub}</div>}
    </motion.div>
  )
}

// ─── AI Insights Panel ────────────────────────────────────────────────────────
function AIInsightsPanel({ total }) {
  const insights = [
    { label: 'Predicted Attendance', value: `${Math.round(total * 0.78)}`, unit: 'attendees', icon: '🎯', color: 'text-green-400' },
    { label: 'No-Show Prediction', value: `${Math.round(total * 0.22)}`, unit: 'registrants', icon: '⚠️', color: 'text-amber-400' },
    { label: 'Food Requirement', value: `${Math.round(total * 0.78 * 3)}`, unit: 'meals/day', icon: '🍽️', color: 'text-cyan-400' },
    { label: 'Seating Required', value: `${Math.round(total * 0.85)}`, unit: 'chairs', icon: '💺', color: 'text-blue-400' },
    { label: 'Volunteers Needed', value: `${Math.round(total * 0.05)}`, unit: 'volunteers', icon: '🙋', color: 'text-purple-400' },
    { label: 'Parking Spots', value: `${Math.round(total * 0.3)}`, unit: 'vehicles', icon: '🚗', color: 'text-rose-400' },
    { label: 'Peak Check-in Time', value: '9:00–10:30', unit: 'AM', icon: '⏰', color: 'text-emerald-400' },
    { label: 'Event Health Score', value: '96', unit: '/100', icon: '⭐', color: 'text-amber-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-purple rounded-2xl p-6 border border-purple-500/20"
    >
      <div className="flex items-center gap-2 mb-5">
        <Brain size={18} className="text-purple-400" />
        <h3 className="text-white font-semibold">AI Insights</h3>
        <span className="badge ml-auto">Live Predictions</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {insights.map(ins => (
          <div key={ins.label} className="glass rounded-xl p-3 text-center">
            <div className="text-xl mb-1">{ins.icon}</div>
            <div className={`font-orbitron text-lg font-bold ${ins.color}`}>{ins.value}</div>
            <div className="text-slate-500 text-xs">{ins.unit}</div>
            <div className="text-slate-400 text-xs mt-1 leading-tight">{ins.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [registrations, setRegistrations] = useState(demoRegistrations)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    setRefreshing(true)
    try {
      const res = await axios.get('/api/registrations')
      setRegistrations(res.data.registrations || demoRegistrations)
    } catch {
      // Use demo data if backend not available
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const total = registrations.length
  const checkedIn = registrations.filter(r => r.checkedIn).length
  const pending = total - checkedIn
  const todayCount = registrations.filter(r => {
    const d = new Date(r.createdAt)
    return d.toDateString() === new Date().toDateString()
  }).length

  const filtered = registrations.filter(r => {
    const matchSearch = r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.registrationId?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'checkedin' && r.checkedIn) || (filter === 'pending' && !r.checkedIn)
    return matchSearch && matchFilter
  })

  const exportCSV = () => {
    const headers = ['Registration ID', 'Name', 'Email', 'Gender', 'Department', 'Occupation', 'City', 'Checked In', 'Registered At']
    const rows = registrations.map(r => [
      r.registrationId, r.fullName, r.email, r.gender, r.department,
      r.occupation, r.city, r.checkedIn ? 'Yes' : 'No', new Date(r.createdAt).toLocaleString()
    ])
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `TechFest-Registrations-${Date.now()}.csv`
    a.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative z-10 min-h-screen pt-24 pb-16 px-4"
    >
      <Navbar />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-orbitron text-2xl md:text-3xl font-bold gradient-text">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">TechFest 2025 — Real-time attendee management</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="btn-ghost px-4 py-2 rounded-xl text-sm flex items-center gap-2"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button onClick={exportCSV} className="btn-primary px-4 py-2 rounded-xl text-sm text-white flex items-center gap-2">
              <Download size={14} />
              Export CSV
            </button>
            <Link to="/checkin" className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
              <QrCode size={14} />
              Check-in
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Registered" value={total} sub="+12 today" glow="#7c3aed" />
          <StatCard icon={UserCheck} label="Checked In" value={checkedIn} sub={`${Math.round(checkedIn/total*100)||0}% rate`} glow="#06b6d4" />
          <StatCard icon={Clock} label="Pending Check-in" value={pending} glow="#f59e0b" />
          <StatCard icon={QrCode} label="QR Generated" value={total} sub="100%" glow="#10b981" />
        </div>

        {/* AI Insights */}
        <AIInsightsPanel total={total} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline Chart */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity size={16} className="text-purple-400" />
              Registration Timeline — Today
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="registrations" stroke="#7c3aed" strokeWidth={2} fill="url(#regGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Pie */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={genderData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {genderData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `${val}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {genderData.map(g => (
                <div key={g.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                  {g.name} {g.value}%
                </div>
              ))}
            </div>
          </div>

          {/* Department Bar */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis dataKey="dept" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={['#7c3aed','#6366f1','#06b6d4','#a855f7','#3b82f6','#10b981'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Age Distribution */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">Age Groups</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Leaderboard */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap size={16} className="text-cyan-400" />
            Top Cities by Registration
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cityData.map((c, i) => (
              <div key={c.city} className="text-center">
                <div className="font-orbitron text-xl font-bold gradient-text">{c.count}</div>
                <div className="text-slate-400 text-xs">{c.city}</div>
                <div className="mt-2 w-full bg-white/5 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                    style={{ width: `${(c.count / cityData[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendee Table */}
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users size={16} className="text-purple-400" />
              Attendees ({filtered.length})
            </h3>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:w-64 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email, ID..."
                  className="w-full input-glass pl-9 pr-4 py-2 rounded-xl text-xs"
                />
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="input-glass px-3 py-2 rounded-xl text-xs bg-transparent"
              >
                <option value="all" className="bg-gray-900">All</option>
                <option value="checkedin" className="bg-gray-900">Checked In</option>
                <option value="pending" className="bg-gray-900">Pending</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-white/5">
                  <th className="pb-3 text-left font-medium">Attendee</th>
                  <th className="pb-3 text-left font-medium">Reg. ID</th>
                  <th className="pb-3 text-left font-medium hidden md:table-cell">Department</th>
                  <th className="pb-3 text-left font-medium hidden lg:table-cell">City</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(r => (
                  <tr key={r._id} className="table-row-hover transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {r.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{r.fullName}</div>
                          <div className="text-slate-500 text-xs">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-purple-300 text-xs">{r.registrationId}</td>
                    <td className="py-3 text-slate-400 text-xs hidden md:table-cell">{r.department}</td>
                    <td className="py-3 text-slate-400 text-xs hidden lg:table-cell">{r.city}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        r.checkedIn
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.checkedIn ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {r.checkedIn ? 'Checked In' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <Users size={40} className="mx-auto mb-2 opacity-30" />
                No registrations found
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
