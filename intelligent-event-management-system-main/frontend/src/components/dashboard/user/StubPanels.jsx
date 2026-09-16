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

export function UserDashboardContent() {
  return <StubPanel title="Dashboard" description="Your event management overview" />
}

export function RegisteredEventsPanel() {
  return <StubPanel title="Registered Events" description="Your registered events" />
}

export function UpcomingEventsPanel() {
  return <StubPanel title="Upcoming Events" description="Events coming soon" />
}

export function QRPassPanel() {
  return <StubPanel title="QR Pass" description="Your event QR pass" />
}

export function AttendanceHistoryPanel() {
  return <StubPanel title="Check-In History" description="Your attendance history" />
}

export function UserNotificationsPanel() {
  return <StubPanel title="Notifications" description="Your notifications" />
}

export function UserProfilePanel() {
  return <StubPanel title="Profile" description="Manage your profile" />
}
