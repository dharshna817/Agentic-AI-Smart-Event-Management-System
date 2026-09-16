import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Users, Building2, Clock3, CheckCircle2, AlertTriangle, Percent, UserCheck, CalendarDays } from 'lucide-react'
import { getAdminOverview } from '../../../services/localDataService'

export default function DashboardContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    try {
      const data = getAdminOverview()
      setOverview(data)
    } catch (err) {
      setError('Failed to load overview')
    } finally {
      setLoading(false)
    }
  }, [])

  const stats = [
    { label: 'Total Events', value: overview?.totalEvents ?? 0, icon: CalendarDays, color: 'from-purple-600 to-indigo-600' },
    { label: 'Total Venues', value: overview?.totalVenues ?? 0, icon: Building2, color: 'from-cyan-600 to-blue-600' },
    { label: 'Total Speakers', value: overview?.totalSpeakers ?? 0, icon: Users, color: 'from-violet-600 to-purple-600' },
    { label: 'Total Sessions', value: overview?.totalSessions ?? 0, icon: Calendar, color: 'from-emerald-600 to-cyan-600' },
    { label: 'Upcoming Sessions', value: overview?.upcomingSessions ?? 0, icon: Clock3, color: 'from-pink-600 to-purple-600' },
    { label: 'Confirmed Sessions', value: overview?.confirmedSessions ?? 0, icon: CheckCircle2, color: 'from-blue-600 to-cyan-600' },
    { label: 'Venue Conflicts', value: overview?.venueConflicts ?? 0, icon: AlertTriangle, color: 'from-amber-600 to-orange-600' },
    { label: 'Speaker Conflicts', value: overview?.speakerConflicts ?? 0, icon: AlertTriangle, color: 'from-rose-600 to-red-600' },
    { label: 'Avg Venue Utilization', value: `${overview?.averageVenueUtilization ?? 0}%`, icon: Percent, color: 'from-sky-600 to-indigo-600' },
    { label: 'Registered Attendees', value: overview?.totalRegisteredAttendees ?? 0, icon: UserCheck, color: 'from-teal-600 to-cyan-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Overview</h1>
        <p className="text-slate-400">Live operations summary for event, venue, and speaker planning</p>
      </div>

      {loading && <div className="text-slate-400">Loading overview...</div>}

      {!loading && error && (
        <div className="glass rounded-3xl p-6 border border-red-500/30 text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-gradient-to-br ${stat.color} bg-opacity-10 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-orbitron font-bold text-white mt-2">{stat.value}</p>
                </div>
                <stat.icon className="text-white/20" size={36} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 border border-white/10">
        <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
        <p className="text-slate-400">Live data updates as sessions, bookings, and assignments are created or modified.</p>
      </motion.div>
    </div>
  )
}
