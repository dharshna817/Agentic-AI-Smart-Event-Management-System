import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Bell, QrCode, UserCircle2, CheckCheck, Clock3, Download } from 'lucide-react'
import QRCode from 'qrcode'

export default function UserDashboardPage() {
  const [user, setUser] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('eventai_user') || 'null')
    setUser(stored)
    if (stored) {
      setForm({
        name: stored.name || '',
        email: stored.email || '',
        phone: stored.phone || '',
      })
    }

    const payload = JSON.stringify({
      userId: stored?.id || 'guest',
      name: stored?.name || 'Guest User',
      email: stored?.email || 'guest@example.com',
      event: 'TechFest 2025',
    })

    QRCode.toDataURL(payload).then(setQrDataUrl).catch(() => setQrDataUrl(''))
  }, [])

  const upcomingEvents = useMemo(() => [
    { id: 1, title: 'AI Tech Summit', date: '2026-08-20', time: '09:00 AM', venue: 'Grand Auditorium' },
    { id: 2, title: 'Women in AI Forum', date: '2026-08-21', time: '10:00 AM', venue: 'Innovation Hall' },
    { id: 3, title: 'Startup Growth Forum', date: '2026-08-27', time: '10:00 AM', venue: 'Innovation Hub' },
    { id: 4, title: 'Healthcare AI Connect', date: '2026-08-28', time: '09:00 AM', venue: 'Medical Pavilion' },
    { id: 5, title: 'Future Mobility Expo', date: '2026-08-30', time: '09:30 AM', venue: 'Tech Arena' },
    { id: 6, title: 'Cybersecurity Leaders Summit', date: '2026-08-31', time: '11:00 AM', venue: 'Secure Hall' },
    { id: 7, title: 'Green Tech Innovation Week', date: '2026-09-02', time: '09:00 AM', venue: 'Sustainability Center' },
  ], [])

  const attendance = [
    { id: 1, type: 'Check-in', time: '2026-09-12 09:15 AM', status: 'Success' },
    { id: 2, type: 'Check-out', time: '2026-09-12 12:10 PM', status: 'Success' },
  ]

  const notifications = [
    { id: 1, title: 'Event reminder', detail: 'Startup Pitch Arena starts in 2 days.' },
    { id: 2, title: 'Venue update', detail: 'Main Hall access gate relocated to Block B.' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-cyan-300 text-xs uppercase tracking-[0.2em]">User Portal</p>
          <h1 className="font-orbitron text-3xl font-bold gradient-text">User Dashboard</h1>
        </div>

        <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold">Registered Events</h3>
              <CalendarDays className="text-purple-300" size={18} />
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="text-white font-semibold">{event.title}</div>
                      <div className="text-slate-400 text-xs mt-1">{event.date} • {event.time} • {event.venue}</div>
                    </div>
                    <span className="badge">Upcoming</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">QR Pass</h3>
              <QrCode className="text-cyan-300" size={18} />
            </div>
            {qrDataUrl ? (
              <div className="space-y-4">
                <img src={qrDataUrl} alt="QR pass" className="w-52 h-52 rounded-2xl bg-white p-3 mx-auto" />
                <button className="btn-primary w-full rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-white">
                  <Download size={16} /> Download pass
                </button>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Generating QR pass...</div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Check-in / Check-out History</h3>
              <CheckCheck className="text-emerald-300" size={18} />
            </div>
            <div className="space-y-3">
              {attendance.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-3 bg-white/5">
                  <div>
                    <div className="text-white text-sm font-medium">{entry.type}</div>
                    <div className="text-slate-400 text-xs">{entry.time}</div>
                  </div>
                  <span className="text-xs text-emerald-300">{entry.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Notifications</h3>
              <Bell className="text-purple-300" size={18} />
            </div>
            <div className="space-y-3">
              {notifications.map((note) => (
                <div key={note.id} className="rounded-2xl border border-white/10 p-3 bg-white/5">
                  <div className="text-white text-sm font-medium">{note.title}</div>
                  <div className="text-slate-400 text-xs mt-1">{note.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 border border-white/10 mt-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Profile</h3>
            <UserCircle2 className="text-cyan-300" size={18} />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-glass rounded-xl px-4 py-3" placeholder="Name" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-glass rounded-xl px-4 py-3" placeholder="Email" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-glass rounded-xl px-4 py-3" placeholder="Phone" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
