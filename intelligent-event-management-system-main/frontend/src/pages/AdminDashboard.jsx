import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, LayoutGrid, Building2, Users, Settings, Bell, BarChart3, CalendarDays, CheckCircle2, LogOut, AlertTriangle, Wand2, ShieldAlert, Handshake, Activity, Sparkles, GitMerge, TrendingUp, Cloud } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DashboardContent from '../components/dashboard/admin/DashboardContent'
import DeployReadinessPanel from '../components/dashboard/admin/DeployReadinessPanel'
import VenueAgentPanel from '../components/dashboard/admin/VenueAgentPanel'
import OrchestrationPanel from '../components/dashboard/admin/OrchestrationPanel'
import ExecutiveOverviewPanel from '../components/dashboard/admin/ExecutiveOverviewPanel'
import {
  EventsPanel,
  SponsorshipManagementPanel,
  SpeakerAgentPanel,
  SessionsPanel,
  SchedulePanel,
  VenueOptimizationPanel,
  ConflictsPanel,
  AnalyticsPanel,
  AttendancePanel,
  NotificationsPanel,
  AdminIncidentsPanel,
  OperationalAlertsPanel,
  OperationalMonitoringPanel,
  AIOperationsIntelligencePanel
} from '../components/dashboard/admin/AdminPanels'

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'executive-overview', label: 'Executive Overview', icon: TrendingUp },
  { id: 'orchestration', label: 'Agent Orchestration', icon: GitMerge },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'ai-intelligence', label: 'AI Operations Intelligence', icon: Sparkles },
  { id: 'alerts', label: 'Operational Alerts', icon: AlertTriangle },
  { id: 'incidents', label: 'Incidents', icon: ShieldAlert },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'sponsorship-management', label: 'Sponsorship Management', icon: Handshake },
  { id: 'venues', label: 'Venues', icon: Building2 },
  { id: 'speakers', label: 'Speakers', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: CalendarDays },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'venue-optimization', label: 'Venue Optimization', icon: Wand2 },
  { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'deploy', label: 'Deploy Platform', icon: Cloud },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('eventai_user')
    navigate('/')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardContent />
      case 'executive-overview':
        return <ExecutiveOverviewPanel />
      case 'orchestration':
        return <OrchestrationPanel />
      case 'monitoring':
        return <OperationalMonitoringPanel />
      case 'ai-intelligence':
        return <AIOperationsIntelligencePanel onNavigate={setActiveTab} />
      case 'alerts':
        return <OperationalAlertsPanel />
      case 'incidents':
        return <AdminIncidentsPanel />
      case 'events':
        return <EventsPanel />
      case 'sponsorship-management':
        return <SponsorshipManagementPanel />
      case 'venues':
        return <VenueAgentPanel />
      case 'speakers':
        return <SpeakerAgentPanel />
      case 'sessions':
        return <SessionsPanel />
      case 'schedule':
        return <SchedulePanel />
      case 'venue-optimization':
        return <VenueOptimizationPanel />
      case 'conflicts':
        return <ConflictsPanel />
      case 'analytics':
        return <AnalyticsPanel />
      case 'attendance':
        return <AttendancePanel />
      case 'notifications':
        return <NotificationsPanel />
      case 'deploy':
        return <DeployReadinessPanel />
      default:
        return <DashboardContent />
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
          className="bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/10 fixed h-full pt-4 overflow-y-auto"
        >
          <div className="px-4 mb-8">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="space-y-2 px-3">
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
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-280' : 'ml-80'}`} style={{ marginLeft: sidebarOpen ? 280 : 80 }}>
          <div className="p-6 md:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
