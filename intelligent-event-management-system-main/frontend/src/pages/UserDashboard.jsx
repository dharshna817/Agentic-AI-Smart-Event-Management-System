import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, LayoutGrid, CalendarDays, Ticket, QrCode, Clock, Bell, User, Settings, LogOut, Globe, Star, CalendarCheck, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  UserDashboardContent,
  BrowseEventsPanel,
  RegisteredEventsPanel,
  UpcomingEventsPanel,
  MySchedulePanel,
  QRPassPanel,
  AttendanceHistoryPanel,
  UserNotificationsPanel,
  FeedbackPanel,
  UserProfilePanel,
  UserIncidentsPanel
} from '../components/dashboard/user/UserPanels'

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'browse-events', label: 'Browse Events', icon: Globe },
  { id: 'registered-events', label: 'Registered Events', icon: Ticket },
  { id: 'my-schedule', label: 'My Schedule', icon: CalendarCheck },
  { id: 'upcoming-events', label: 'Upcoming Sessions', icon: CalendarDays },
  { id: 'qr-pass', label: 'QR Pass', icon: QrCode },
  { id: 'attendance-history', label: 'Check-In History', icon: Clock },
  { id: 'incidents', label: 'Incidents', icon: ShieldAlert },
  { id: 'feedback', label: 'Feedback', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('eventai_user')
    navigate('/')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <UserDashboardContent />
      case 'browse-events': return <BrowseEventsPanel />
      case 'registered-events': return <RegisteredEventsPanel />
      case 'my-schedule': return <MySchedulePanel />
      case 'upcoming-events': return <UpcomingEventsPanel />
      case 'qr-pass': return <QRPassPanel />
      case 'attendance-history': return <AttendanceHistoryPanel />
      case 'incidents': return <UserIncidentsPanel />
      case 'feedback': return <FeedbackPanel />
      case 'notifications': return <UserNotificationsPanel />
      case 'profile': return <UserProfilePanel />
      default: return <UserDashboardContent />
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="flex pt-20 min-h-screen">
        {/* Sidebar */}
        <motion.div
          animate={{ width: sidebarOpen ? 280 : 80 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/10 fixed h-full pt-4 overflow-y-auto z-10"
        >
          <div className="px-4 mb-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="space-y-1 px-3">
            {sidebarItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ x: 4 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                    : 'text-slate-400 hover:bg-white/10'
                  }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </motion.button>
            ))}
          </div>

          {/* Logout Button */}
          <div className="absolute bottom-4 left-0 right-0 px-3">
            <motion.button
              onClick={handleLogout}
              whileHover={{ x: 4 }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition"
            >
              <LogOut size={20} />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </motion.button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 transition-all duration-300" style={{ marginLeft: sidebarOpen ? 280 : 80 }}>
          <div className="p-6 md:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
