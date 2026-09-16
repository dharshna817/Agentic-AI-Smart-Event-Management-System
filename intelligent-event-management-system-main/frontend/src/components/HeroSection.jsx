import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Users, Zap, Star, ChevronDown } from 'lucide-react'

const floatingStats = [
  { label: 'Registered', value: '12,450+', icon: Users, color: 'purple' },
  { label: 'Events Managed', value: '340+', icon: Zap, color: 'cyan' },
  { label: 'Success Rate', value: '99.8%', icon: Star, color: 'blue' },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-12 overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="blob blob-purple w-96 h-96 -top-20 -left-20" style={{ width: 500, height: 500 }} />
      <div className="blob blob-cyan w-80 h-80 top-1/3 -right-20" style={{ width: 400, height: 400 }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-6"
        >
          <div className="badge flex items-center gap-2 animate-pulse-slow">
            <Sparkles size={12} />
            Agentic AI Operations Platform
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-orbitron text-4xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6"
        >
          <span className="gradient-text">Agentic AI</span>
          <br />
          <span className="text-white">for Smart Event Management</span>{' '}
          <span className="gradient-text">Operations</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Register attendees, generate QR codes, send automated reminders, and unlock
          AI-powered insights — all in one futuristic platform designed for the next generation of events.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link
            to="/register"
            className="group btn-primary px-8 py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-3 text-white"
          >
            <Sparkles size={18} />
            Register for Event
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Floating Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-16"
        >
          {floatingStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass rounded-2xl p-4 stat-card"
            >
              <div className={`flex items-center gap-2 mb-1`}>
                <stat.icon
                  size={16}
                  className={stat.color === 'purple' ? 'text-purple-400' : stat.color === 'cyan' ? 'text-cyan-400' : 'text-blue-400'}
                />
                <span className="text-slate-400 text-xs font-medium">{stat.label}</span>
              </div>
              <div className="font-orbitron text-2xl font-bold gradient-text">{stat.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Illustration — Animated futuristic event card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="glass rounded-3xl p-6 border border-purple-500/20 shadow-2xl shadow-purple-900/30 floating">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 glass rounded-full px-4 py-1 text-slate-500 text-xs text-center">
                eventai.platform / dashboard
              </div>
            </div>
            {/* Mock Dashboard Preview */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Registered', val: '2,847', color: 'from-purple-600 to-indigo-600' },
                { label: 'Checked In', val: '1,923', color: 'from-cyan-600 to-blue-600' },
                { label: 'QR Generated', val: '2,847', color: 'from-violet-600 to-purple-600' },
                { label: 'Event Health', val: '96%', color: 'from-emerald-600 to-cyan-600' },
              ].map(card => (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} bg-opacity-20 rounded-xl p-3`}>
                  <div className="text-white/60 text-xs mb-1">{card.label}</div>
                  <div className="font-orbitron text-white text-xl font-bold">{card.val}</div>
                </div>
              ))}
            </div>
            {/* Mini chart */}
            <div className="flex items-end gap-1 h-16">
              {[40,65,50,80,70,90,85,95,75,88,92,100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-purple-600 to-cyan-500 rounded-t-sm opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="text-slate-500 text-xs mt-2">Registration trend — last 12 hours</div>
          </div>

          {/* Floating badges */}
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-4 -right-4 glass-purple rounded-2xl px-4 py-2 text-xs font-semibold text-purple-300 glow-purple"
          >
            🤖 AI Insights Active
          </motion.div>
          <motion.div
            animate={{ y: [5, -5, 5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-4 -left-4 glass rounded-2xl px-4 py-2 text-xs font-semibold text-cyan-300 border border-cyan-500/30"
          >
            ✅ 23 Check-ins in last 5 min
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 flex flex-col items-center gap-1"
      >
        <span className="text-xs">Scroll to explore</span>
        <ChevronDown size={20} />
      </motion.div>
    </section>
  )
}
