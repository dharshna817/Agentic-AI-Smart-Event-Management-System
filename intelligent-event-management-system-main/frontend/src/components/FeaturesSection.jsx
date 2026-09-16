import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  QrCode, Brain, Bell, BarChart3, Shield, Zap,
  Users, Smartphone, Globe, Lock, Star, TrendingUp
} from 'lucide-react'

const features = [
  {
    icon: QrCode, title: 'Instant QR Generation',
    desc: 'Auto-generate unique QR codes and event passes immediately after registration. Downloadable and email-ready.',
    color: 'from-purple-600 to-indigo-600', glow: 'rgba(124,58,237,0.4)',
  },
  {
    icon: Brain, title: 'AI Attendee Analytics',
    desc: 'Predict attendance, detect no-shows, estimate food & seating requirements with AI-powered intelligence.',
    color: 'from-cyan-600 to-blue-600', glow: 'rgba(6,182,212,0.4)',
  },
  {
    icon: Bell, title: 'Smart Reminders',
    desc: 'Automated reminder schedule: 7 days, 3 days, 1 day, 2 hours, and 30 minutes before your event.',
    color: 'from-violet-600 to-purple-600', glow: 'rgba(139,92,246,0.4)',
  },
  {
    icon: BarChart3, title: 'Real-time Dashboard',
    desc: 'Live registration trends, department & gender distribution, age analysis, and location heatmaps.',
    color: 'from-blue-600 to-cyan-600', glow: 'rgba(59,130,246,0.4)',
  },
  {
    icon: Shield, title: 'Fraud Detection',
    desc: 'AI-powered duplicate detection, fake QR prevention, and real-time fraud alerts protect your event.',
    color: 'from-emerald-600 to-cyan-600', glow: 'rgba(16,185,129,0.4)',
  },
  {
    icon: Zap, title: 'QR Check-in Scanner',
    desc: 'Scan QR codes with any camera for instant attendance marking, duplicate prevention, and live count.',
    color: 'from-amber-600 to-orange-600', glow: 'rgba(245,158,11,0.4)',
  },
  {
    icon: Users, title: 'AI Networking',
    desc: 'Smart attendee matching based on skills and interests for maximum event networking value.',
    color: 'from-pink-600 to-rose-600', glow: 'rgba(236,72,153,0.4)',
  },
  {
    icon: Globe, title: 'Multi-Source Import',
    desc: 'Import registrations from Google Forms, Microsoft Forms, Excel, CSV, or any API seamlessly.',
    color: 'from-indigo-600 to-blue-600', glow: 'rgba(99,102,241,0.4)',
  },
  {
    icon: TrendingUp, title: 'Event Health Score',
    desc: 'AI computes an Event Health Score based on registration pace, engagement, and prediction accuracy.',
    color: 'from-teal-600 to-green-600', glow: 'rgba(20,184,166,0.4)',
  },
]

function FeatureCard({ feature, index }) {
  const ref = useRef(null)

  const onMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    ref.current.style.transform = `perspective(800px) rotateX(${-y/20}deg) rotateY(${x/20}deg) translateY(-8px)`
  }

  const onMouseLeave = () => {
    ref.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)'
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="glass rounded-2xl p-6 stat-card cursor-pointer group"
      style={{ transition: 'transform 0.2s ease, box-shadow 0.3s ease' }}
    >
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        style={{ boxShadow: `0 0 20px ${feature.glow}` }}
      >
        <feature.icon size={22} className="text-white" />
      </div>
      <h3 className="font-semibold text-white text-base mb-2 group-hover:text-purple-300 transition-colors">
        {feature.title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>

      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${feature.glow}`, borderRadius: '1rem' }}
      />
    </motion.div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="badge inline-flex items-center gap-2 mb-4">
            <Star size={12} />
            Platform Features
          </div>
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to
            <br />
            <span className="gradient-text">Run Perfect Events</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            From registration to check-in, our AI platform handles every detail
            so you can focus on creating unforgettable experiences.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
