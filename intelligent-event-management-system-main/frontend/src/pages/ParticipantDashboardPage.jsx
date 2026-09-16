import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import QRCode from 'qrcode'
import { CalendarDays, Bell, QrCode, UserCircle2, CheckCheck, ClipboardList } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function ParticipantDashboardPage() {
  const [user, setUser] = useState(null)
  const [qr, setQr] = useState('')
  const [notifications, setNotifications] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('eventai-user') || 'null')
    setUser(storedUser)

    const loadData = async () => {
      try {
        if (storedUser?.email) {
          const qrRes = await axios.get(`/api/enterprise/participant-qr?email=${encodeURIComponent(storedUser.email)}`)
          const dataUrl = await QRCode.toDataURL(JSON.stringify({ registrationId: qrRes.data.registrationId, email: qrRes.data.email, qrToken: qrRes.data.qrToken }))
          setQr(dataUrl)
        }
        const notesRes = await axios.get('/api/enterprise/notifications?role=participant')
        setNotifications(notesRes.data)
        setHistory([
          { id: 1, title: 'Welcome briefing', status: 'Done', time: 'Today 9:30 AM' },
          { id: 2, title: 'QR issued', status: 'Active', time: 'Today 10:15 AM' },
        ])
      } catch (error) {
        console.error(error)
      }
    }

    loadData()
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 min-h-screen pt-24 pb-16 px-4">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-cyan-300 text-xs uppercase tracking-[0.2em]">Participant Portal</p>
          <h1 className="font-orbitron text-3xl font-bold gradient-text">Welcome, {user?.name || 'Guest'}</h1>
        </div>

        <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold">My QR Pass</h3>
              <QrCode className="text-purple-300" size={18} />
            </div>

            {qr ? (
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <img src={qr} alt="QR Pass" className="w-52 h-52 rounded-2xl border border-white/10 bg-white p-3" />
                <div className="space-y-3 text-sm text-slate-300 flex-1">
                  <div><span className="text-slate-500 block text-xs">Name</span> {user?.name}</div>
                  <div><span className="text-slate-500 block text-xs">Email</span> {user?.email}</div>
                  <div><span className="text-slate-500 block text-xs">Status</span> Active registration</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">QR pass is being generated...</div>
            )}
          </div>

          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Notifications</h3>
              <Bell className="text-cyan-300" size={18} />
            </div>
            <div className="space-y-3">
              {notifications.length === 0 ? <div className="text-slate-400 text-sm">No new updates</div> : notifications.map((note) => (
                <div key={note.id} className="rounded-2xl border border-white/10 p-3 bg-white/5">
                  <div className="text-white text-sm font-medium">{note.title}</div>
                  <div className="text-slate-400 text-xs mt-1">{note.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <InfoCard icon={CalendarDays} label="Registered Events" value="03" />
          <InfoCard icon={CheckCheck} label="Check-in / Check-out" value="2 actions" />
          <InfoCard icon={UserCircle2} label="Profile" value="Complete" />
        </div>

        <div className="glass rounded-3xl p-6 border border-white/10 mt-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Attendance History</h3>
            <ClipboardList className="text-purple-300" size={18} />
          </div>
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-3 bg-white/5">
                <div>
                  <div className="text-white text-sm font-medium">{entry.title}</div>
                  <div className="text-slate-400 text-xs">{entry.time}</div>
                </div>
                <span className="text-xs text-emerald-300">{entry.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="glass rounded-3xl p-5 border border-white/10">
      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
        <Icon size={18} className="text-cyan-300" />
      </div>
      <div className="text-2xl font-orbitron text-white">{value}</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </div>
  )
}
