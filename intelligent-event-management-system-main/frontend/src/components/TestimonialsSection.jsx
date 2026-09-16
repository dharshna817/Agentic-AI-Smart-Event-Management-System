import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Priya Sharma', role: 'Student, IIT Bombay',
    avatar: 'PS', color: 'from-purple-600 to-indigo-600',
    text: 'The registration process was incredibly smooth! Got my QR code in seconds and the AI chatbot answered all my questions instantly. Best event platform I\'ve used.',
    stars: 5,
  },
  {
    name: 'Rahul Mehta', role: 'Software Engineer, Google',
    avatar: 'RM', color: 'from-cyan-600 to-blue-600',
    text: 'As an organizer, the AI analytics blew my mind. The attendance prediction was 97% accurate! The dashboard gave us real-time insights we never had before.',
    stars: 5,
  },
  {
    name: 'Ananya Krishnan', role: 'Startup Founder',
    avatar: 'AK', color: 'from-violet-600 to-purple-600',
    text: 'The automated reminders and QR check-in system made our event flawless. We had 3000 attendees and zero queue issues. Absolutely phenomenal platform!',
    stars: 5,
  },
  {
    name: 'Dev Patel', role: 'Event Manager, TechCorp',
    avatar: 'DP', color: 'from-blue-600 to-cyan-600',
    text: 'AI networking suggestions helped attendees connect with the right people. Engagement went up 40%. The Event Health Score kept us on track throughout.',
    stars: 5,
  },
  {
    name: 'Sara Johnson', role: 'PhD Student, MIT',
    avatar: 'SJ', color: 'from-rose-600 to-pink-600',
    text: 'Registration took less than 2 minutes and the event pass looked incredibly professional. The food requirement prediction was spot-on — no wastage!',
    stars: 5,
  },
  {
    name: 'Karthik Rajan', role: 'CTO, InnovateLab',
    avatar: 'KR', color: 'from-emerald-600 to-teal-600',
    text: 'We imported 800 Google Form registrations in one click. The duplicate detection caught 23 double entries automatically. This platform is a game-changer.',
    stars: 5,
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24 px-4 overflow-hidden">
      <div className="blob blob-purple absolute -bottom-20 right-0 opacity-10" style={{ width: 400, height: 400 }} />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="badge inline-flex items-center gap-2 mb-4">
            <Star size={12} />
            Testimonials
          </div>
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">
            Loved by <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Organizers and attendees across hundreds of events trust EventAI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass rounded-2xl p-6 relative overflow-hidden group"
            >
              <Quote size={32} className="absolute top-4 right-4 text-white opacity-[0.05] group-hover:opacity-10 transition-opacity" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array(t.stars).fill(0).map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-5">"{t.text}"</p>

              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center font-bold text-sm text-white flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 glass rounded-2xl p-6 flex flex-wrap justify-around gap-6"
        >
          {[
            { value: '50,000+', label: 'Registrations Processed' },
            { value: '340+', label: 'Events Managed' },
            { value: '99.8%', label: 'Uptime' },
            { value: '4.9/5', label: 'Average Rating' },
            { value: '< 2min', label: 'Registration Time' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="font-orbitron text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
