import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { BarChart3, Building2, Users, CalendarRange, BrainCircuit, Bell, Settings, QrCode, ShieldCheck, ArrowRight } from 'lucide-react'
import Navbar from '../components/Navbar'

const panelStyles = 'glass rounded-3xl p-6 border border-white/10'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalVenues: 0, totalSpeakers: 0, sessionsScheduled: 0, checkins: 0, utilizationScore: 0 })
  const [venues, setVenues] = useState([])
  const [speakers, setSpeakers] = useState([])
  const [sessions, setSessions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venueRes, speakerRes, sessionRes, analyticsRes, noteRes] = await Promise.all([
          axios.get('/api/enterprise/venues'),
          axios.get('/api/enterprise/speakers'),
          axios.get('/api/enterprise/sessions'),
          axios.get('/api/enterprise/analytics'),
          axios.get('/api/enterprise/notifications?role=admin'),
        ])

        setVenues(venueRes.data)
        setSpeakers(speakerRes.data)
        setSessions(sessionRes.data)
        setStats(analyticsRes.data.overview || stats)
        setNotifications(noteRes.data)
      } catch (error) {
        console.error('Admin dashboard load failed', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 min-h-screen pt-24 pb-16 px-4">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <p className="text-purple-300 text-xs uppercase tracking-[0.2em]">Enterprise Control Center</p>
            <h1 className="font-orbitron text-3xl font-bold gradient-text">Admin Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/venue-agent" className="btn-ghost rounded-xl px-4 py-2 text-sm">Venue Agent</Link>
            <Link to="/speaker-agent" className="btn-ghost rounded-xl px-4 py-2 text-sm">Speaker Agent</Link>
            <Link to="/login" className="btn-primary rounded-xl px-4 py-2 text-sm text-white">Access Portal</Link>
          </div>
        </div>

        {!loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <StatCard icon={Building2} label="Venues" value={stats.totalVenues || venues.length} color="#8b5cf6" />
              <StatCard icon={Users} label="Speakers" value={stats.totalSpeakers || speakers.length} color="#22d3ee" />
              <StatCard icon={CalendarRange} label="Sessions" value={stats.sessionsScheduled || sessions.length} color="#34d399" />
              <StatCard icon={QrCode} label="Check-ins" value={stats.checkins || 0} color="#fbbf24" />
              <StatCard icon={BrainCircuit} label="Utilization" value={`${stats.utilizationScore || 86}%`} color="#f472b6" />
            </div>

            <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <div className={panelStyles}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold">Venue Operations</h3>
                  <button className="badge">Live</button>
                </div>
                <div className="space-y-3">
                  {venues.map((venue) => (
                    <div key={venue.id} className="border border-white/10 rounded-2xl p-4 bg-white/5">
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="text-white font-semibold">{venue.name}</div>
                          <div className="text-slate-400 text-xs">{venue.location}</div>
                        </div>
                        <div className="text-right text-xs text-emerald-300">{venue.status}</div>
                      </div>
                      <div className="mt-3 flex justify-between text-xs text-slate-400">
                        <span>Capacity {venue.capacity}</span>
                        <span>{venue.equipment ? venue.equipment.length : 0} equipment items</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={panelStyles}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold">Notifications</h3>
                  <Bell className="text-purple-300" size={18} />
                </div>
                <div className="space-y-3">
                  {notifications.length === 0 ? <div className="text-slate-400 text-sm">No active alerts.</div> : notifications.map((note) => (
                    <div key={note.id} className="rounded-2xl border border-white/10 p-3 bg-white/5">
                      <div className="text-white text-sm font-medium">{note.title}</div>
                      <div className="text-slate-400 text-xs mt-1">{note.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <div className={panelStyles}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold">Speaker Pipeline</h3>
                  <ShieldCheck className="text-cyan-300" size={18} />
                </div>
                <div className="space-y-3">
                  {speakers.map((speaker) => (
                    <div key={speaker.id} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                      <div className="flex justify-between">
                        <div>
                          <div className="text-white font-semibold">{speaker.name}</div>
                          <div className="text-slate-400 text-xs">{speaker.expertise ? speaker.expertise.join(', ') : 'General expertise'}</div>
                        </div>
                        <span className="text-xs text-cyan-300">{speaker.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={panelStyles}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-white font-semibold">Session Plan</h3>
                  <CalendarRange className="text-emerald-300" size={18} />
                </div>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                      <div className="text-white font-medium">{session.session_name}</div>
                      <div className="text-slate-400 text-xs mt-1">{new Date(session.start_time).toLocaleString()} → {new Date(session.end_time).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-3xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <ArrowRight size={16} className="text-slate-400" />
      </div>
      <div className="text-2xl font-orbitron text-white">{value}</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </div>
  )
}
