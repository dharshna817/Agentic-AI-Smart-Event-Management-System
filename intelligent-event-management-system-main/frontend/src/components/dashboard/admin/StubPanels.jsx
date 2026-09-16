import { motion } from 'framer-motion'

const StubPanel = ({ title, description }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div>
      <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">{title}</h1>
      <p className="text-slate-400">{description}</p>
    </div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-12 border border-white/10 text-center">
      <p className="text-slate-400 text-lg">Coming soon...</p>
    </motion.div>
  </motion.div>
)

export function SpeakerAgentPanel() {
  return <StubPanel title="Speaker Agent" description="Intelligent speaker management and scheduling" />
}

export function SessionsPanel() {
  return <StubPanel title="Sessions" description="Manage event sessions and scheduling" />
}

export function AnalyticsPanel() {
  return <StubPanel title="Analytics" description="Venue utilization and attendance analytics" />
}

export function AttendancePanel() {
  return <StubPanel title="Attendance" description="Check-in and check-out management" />
}

export function NotificationsPanel() {
  return <StubPanel title="Notifications" description="Notification management and history" />
}
