import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Mic2, Sparkles, CalendarClock, BellRing } from 'lucide-react'

export default function SpeakerAgentPage() {
  const [speakers, setSpeakers] = useState([])
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [speakerRes, sessionRes] = await Promise.all([
          axios.get('/api/enterprise/speakers'),
          axios.get('/api/enterprise/sessions'),
        ])
        setSpeakers(speakerRes.data)
        setSessions(sessionRes.data)
      } catch (error) {
        console.error('Speaker agent data failed', error)
      }
    }

    load()
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-cyan-300 text-xs uppercase tracking-[0.2em]">Speaker Intelligence</p>
          <h1 className="font-orbitron text-3xl font-bold gradient-text">Speaker Agent</h1>
        </div>

        <div className="grid xl:grid-cols-2 gap-6">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Speaker Profiles</h3>
              <Mic2 className="text-cyan-300" size={18} />
            </div>
            <div className="space-y-3">
              {speakers.map((speaker) => (
                <div key={speaker.id} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{speaker.name}</div>
                      <div className="text-slate-400 text-xs">{speaker.expertise?.join(', ') || 'General expertise'}</div>
                    </div>
                    <span className="text-xs text-emerald-300">{speaker.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Assignments & Reminders</h3>
              <BellRing className="text-purple-300" size={18} />
            </div>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                  <div className="text-white font-medium">{session.session_name}</div>
                  <div className="text-slate-400 text-xs mt-1">{new Date(session.start_time).toLocaleString()} — {new Date(session.end_time).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
