import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ScanLine, ShieldCheck, Users, Clock3, AlertTriangle, CheckCircle2, QrCode, Sparkles, Search, RefreshCcw, Radio, BadgeCheck } from 'lucide-react'
import Navbar from '../components/Navbar'

const seededAttendees = [
  { registrationId: 'EVT-2025-A1B2', fullName: 'Priya Sharma', email: 'priya@example.com', department: 'Computer Science', checkedInAt: '09:14 AM' },
  { registrationId: 'EVT-2025-C3D4', fullName: 'Rahul Mehta', email: 'rahul@example.com', department: 'Engineering', checkedInAt: null },
  { registrationId: 'EVT-2025-E5F6', fullName: 'Ananya Krishnan', email: 'ananya@example.com', department: 'Design', checkedInAt: '09:26 AM' },
  { registrationId: 'EVT-2025-G7H8', fullName: 'Dev Patel', email: 'dev@example.com', department: 'Management', checkedInAt: null },
  { registrationId: 'EVT-2025-I9J0', fullName: 'Sara Johnson', email: 'sara@example.com', department: 'Research', checkedInAt: '09:02 AM' },
]

const initialLog = [
  { label: 'Priya Sharma', status: 'checked in', time: '09:14 AM', tone: 'text-emerald-300' },
  { label: 'Fake QR attempt blocked', status: 'fraud detected', time: '09:17 AM', tone: 'text-rose-300' },
  { label: 'Ananya Krishnan', status: 'checked in', time: '09:26 AM', tone: 'text-cyan-300' },
]

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="glass rounded-2xl p-4 stat-card">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`} style={{ background: 'rgba(255,255,255,0.04)' }}>
          <Icon size={18} />
        </div>
        <BadgeCheck size={15} className="text-emerald-400" />
      </div>
      <div className="font-orbitron text-2xl font-bold text-white mt-3">{value}</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </div>
  )
}

export default function CheckinPage() {
  const [query, setQuery] = useState('')
  const [attendees, setAttendees] = useState(seededAttendees)
  const [scanLog, setScanLog] = useState(initialLog)
  const [status, setStatus] = useState({ tone: 'text-slate-400', title: 'Scanner ready', message: 'Scan or enter a registration ID to verify entry.' })

  const totalRegistered = attendees.length
  const checkedIn = attendees.filter((item) => item.checkedInAt).length
  const pending = totalRegistered - checkedIn
  const blocked = scanLog.filter((item) => item.status === 'fraud detected').length

  const latestAttendee = useMemo(() => attendees.find((item) => item.checkedInAt), [attendees])

  const resolveScan = (rawValue) => {
    const value = rawValue.trim()
    if (!value) {
      setStatus({ tone: 'text-rose-300', title: 'No QR data found', message: 'Paste a registration ID, attendee name, or QR payload to continue.' })
      return
    }

    let parsed = value
    if (value.startsWith('{')) {
      try {
        const payload = JSON.parse(value)
        parsed = payload.id || payload.registrationId || payload.email || ''
      } catch {
        parsed = value
      }
    }

    const match = attendees.find((item) => {
      const needle = parsed.toLowerCase()
      return item.registrationId.toLowerCase() === needle || item.email.toLowerCase() === needle || item.fullName.toLowerCase() === needle
    })

    if (!match) {
      setStatus({ tone: 'text-rose-300', title: 'Fake QR blocked', message: 'The payload did not match a registered attendee and was rejected.' })
      setScanLog((prev) => [{ label: value.slice(0, 24), status: 'fraud detected', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), tone: 'text-rose-300' }, ...prev].slice(0, 6))
      return
    }

    if (match.checkedInAt) {
      setStatus({ tone: 'text-amber-300', title: 'Duplicate prevented', message: `${match.fullName} already checked in at ${match.checkedInAt}.` })
      setScanLog((prev) => [{ label: match.fullName, status: 'duplicate scan', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), tone: 'text-amber-300' }, ...prev].slice(0, 6))
      return
    }

    const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setAttendees((prev) => prev.map((item) => (item.registrationId === match.registrationId ? { ...item, checkedInAt: checkInTime } : item)))
    setScanLog((prev) => [{ label: match.fullName, status: 'checked in', time: checkInTime, tone: 'text-emerald-300' }, ...prev].slice(0, 6))
    setStatus({ tone: 'text-emerald-300', title: 'Access granted', message: `${match.fullName} verified successfully. Attendance saved at ${checkInTime}.` })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 min-h-screen pt-24 pb-16 px-4"
    >
      <Navbar />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="badge inline-flex items-center gap-2 mb-4">
              <QrCode size={12} />
              Live QR Check-in
            </div>
            <h1 className="font-orbitron text-3xl md:text-5xl font-bold text-white leading-tight">
              AI powered <span className="gradient-text">attendance gate</span> for instant entry verification
            </h1>
            <p className="text-slate-400 mt-3 text-sm md:text-base max-w-2xl">
              Scan a QR payload, prevent duplicate entry, block fake passes, and keep the live attendee count in sync for organizers.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="btn-ghost rounded-xl px-4 py-2 text-sm text-center">
              Back to registration
            </Link>
            <Link to="/dashboard" className="btn-primary rounded-xl px-4 py-2 text-sm text-center">
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Live attendees" value={checkedIn} tone="text-cyan-300" />
          <StatCard icon={Clock3} label="Pending check-ins" value={pending} tone="text-amber-300" />
          <StatCard icon={ShieldCheck} label="Blocked fraud attempts" value={blocked} tone="text-rose-300" />
          <StatCard icon={ScanLine} label="Scanner health" value="99.9%" tone="text-purple-300" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 glass rounded-3xl p-6 border border-white/10 shadow-2xl shadow-purple-900/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center glow-purple">
                <Radio size={20} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Check-in scanner</div>
                <div className="text-slate-500 text-xs">Demo mode with duplicate and fraud detection</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
              <div className="lg:col-span-3 rounded-3xl border border-white/10 bg-white/5 p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-slate-400 text-xs">SCANNER STATUS</div>
                      <div className={`font-semibold ${status.tone}`}>{status.title}</div>
                    </div>
                    <Sparkles size={18} className="text-cyan-300" />
                  </div>

                  <div className="aspect-[4/3] rounded-3xl border border-dashed border-purple-400/30 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.16),rgba(15,15,26,0.9)_60%)] flex items-center justify-center text-center p-6 mb-4">
                    <div>
                      <div className="w-20 h-20 rounded-full border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center mx-auto mb-4 glow-cyan">
                        <QrCode size={34} className="text-cyan-300" />
                      </div>
                      <div className="text-white font-semibold">Camera / QR feed</div>
                      <div className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                        Connect a camera scanner here, or use the manual test field to simulate a QR payload.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Paste registration ID, name, email, or QR payload"
                      className="flex-1 input-glass px-4 py-3 rounded-xl text-sm"
                    />
                    <button onClick={() => resolveScan(query)} className="btn-primary px-5 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                      <Search size={15} />
                      Verify
                    </button>
                    <button onClick={() => resolveScan('{"id":"EVT-2025-C3D4"}')} className="btn-ghost px-5 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                      <RefreshCcw size={15} />
                      Demo scan
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                      <AlertTriangle size={15} className="text-amber-300" />
                      Verification note
                    </div>
                    <p className={`text-sm ${status.tone}`}>{status.message}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="glass rounded-3xl p-5 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    <h2 className="text-white font-semibold">Recent check-ins</h2>
                  </div>
                  <div className="space-y-3">
                    {scanLog.map((entry) => (
                      <div key={`${entry.label}-${entry.time}`} className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-3">
                        <div>
                          <div className={`text-sm font-medium ${entry.tone}`}>{entry.label}</div>
                          <div className="text-slate-500 text-xs capitalize">{entry.status}</div>
                        </div>
                        <div className="text-slate-500 text-xs whitespace-nowrap">{entry.time}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-purple rounded-3xl p-5 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-purple-300" />
                    <h2 className="text-white font-semibold">Live AI summary</h2>
                  </div>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>{checkedIn} attendees are inside, with the latest verified entry from {latestAttendee?.fullName || 'the scanner queue'}.</p>
                    <p>Duplicate scans are blocked automatically and suspicious QR payloads are tagged for review.</p>
                    <p className="text-cyan-300">Recommended action: keep scanning during the peak arrival window to stabilize the entry queue.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 glass rounded-3xl p-6 border border-white/10 shadow-2xl shadow-cyan-900/10">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-cyan-300" />
              <h2 className="text-white font-semibold">Attendance roster</h2>
            </div>
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {attendees.map((attendee) => (
                <div key={attendee.registrationId} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white font-medium text-sm">{attendee.fullName}</div>
                      <div className="text-slate-500 text-xs mt-1">{attendee.department}</div>
                    </div>
                    <div className={`text-xs px-2.5 py-1 rounded-full ${attendee.checkedInAt ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'}`}>
                      {attendee.checkedInAt ? `In at ${attendee.checkedInAt}` : 'Awaiting scan'}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500">
                    <span>{attendee.registrationId}</span>
                    <span>{attendee.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}