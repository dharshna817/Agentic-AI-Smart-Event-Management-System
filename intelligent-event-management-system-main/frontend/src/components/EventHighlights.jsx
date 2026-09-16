import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Users, Trophy, Mic, Code, Coffee } from 'lucide-react'

const highlights = [
  { icon: Mic, label: '20+ Speakers', sub: 'Industry leaders & innovators', color: 'text-purple-400' },
  { icon: Code, label: '48hr Hackathon', sub: 'Build, compete, win', color: 'text-cyan-400' },
  { icon: Users, label: '3000+ Attendees', sub: 'Global community', color: 'text-blue-400' },
  { icon: Trophy, label: '₹10L Prize Pool', sub: 'Across categories', color: 'text-amber-400' },
  { icon: Coffee, label: 'Free Meals', sub: 'All 3 days included', color: 'text-emerald-400' },
  { icon: Clock, label: '72 Hours', sub: 'Of pure innovation', color: 'text-rose-400' },
]

const schedule = [
  { day: 'Day 1', date: 'Sep 15', events: ['9:00 AM — Opening Ceremony & Keynote', '11:00 AM — Panel: Future of AI', '2:00 PM — Workshop Sessions Begin', '7:00 PM — Welcome Networking Dinner'] },
  { day: 'Day 2', date: 'Sep 16', events: ['9:00 AM — Hackathon Kicks Off', '12:00 PM — Mentor Sessions', '4:00 PM — Lightning Talks', '9:00 PM — Midnight Hack Challenge'] },
  { day: 'Day 3', date: 'Sep 17', events: ['10:00 AM — Project Demos', '1:00 PM — Jury Evaluation', '4:00 PM — Award Ceremony', '6:00 PM — Closing Keynote & Farewell'] },
]

export default function EventHighlights() {
  return (
    <section id="highlights" className="relative py-24 px-4">
      {/* Background accent */}
      <div className="blob blob-cyan absolute top-1/2 left-0 w-64 h-64 opacity-10" style={{ width: 350, height: 350 }} />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="badge inline-flex items-center gap-2 mb-4">
            <Calendar size={12} />
            TechFest 2025
          </div>
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">
            Event <span className="gradient-text">Highlights</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Three days of innovation, learning, and connection at the biggest tech event of the year.
          </p>

          {/* Event Meta */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar size={16} className="text-purple-400" />
              September 15–17, 2025
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin size={16} className="text-cyan-400" />
              Tech Innovation Centre, Tech City
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock size={16} className="text-blue-400" />
              9:00 AM — 9:00 PM Daily
            </div>
          </div>
        </motion.div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {highlights.map((h, i) => (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.08, y: -6 }}
              className="glass rounded-2xl p-4 text-center stat-card"
            >
              <h.icon size={28} className={`${h.color} mx-auto mb-2`} />
              <div className="text-white font-bold text-base">{h.label}</div>
              <div className="text-slate-500 text-xs mt-1">{h.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Schedule Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {schedule.map((day, i) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, x: i === 0 ? -30 : i === 2 ? 30 : 0, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="glass-purple rounded-2xl p-6 relative overflow-hidden"
            >
              {/* Day badge */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex flex-col items-center justify-center glow-purple">
                  <span className="text-white text-xs font-bold">{day.date}</span>
                </div>
                <div>
                  <div className="text-white font-bold text-lg font-orbitron">{day.day}</div>
                  <div className="text-purple-300 text-xs">Schedule</div>
                </div>
              </div>
              <div className="space-y-3">
                {day.events.map((evt, j) => (
                  <div key={j} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                    <span className="text-slate-300 text-sm leading-snug">{evt}</span>
                  </div>
                ))}
              </div>
              {/* Decorative number */}
              <div className="absolute top-4 right-4 font-orbitron text-6xl font-black text-white opacity-[0.04]">
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
