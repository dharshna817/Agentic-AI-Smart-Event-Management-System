import { Link } from 'react-router-dom'
import { Zap, Twitter, Linkedin, Github, Mail, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center glow-purple">
                <Zap size={18} className="text-white" />
              </div>
              <span className="font-orbitron font-bold text-xl gradient-text">EventAI</span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-4">
              The world's most intelligent event registration and attendee management platform. Powered by AI, built for the future.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <button key={i} className="w-9 h-9 glass rounded-lg flex items-center justify-center text-slate-400 hover:text-purple-400 hover:border-purple-500/40 transition-all border border-white/10">
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-slate-400 hover:text-purple-300 text-sm transition-colors">Register</Link></li>
              <li><Link to="/dashboard" className="text-slate-400 hover:text-purple-300 text-sm transition-colors">Dashboard</Link></li>
              <li><Link to="/checkin" className="text-slate-400 hover:text-purple-300 text-sm transition-colors">Check-in</Link></li>
              <li><a href="/#features" className="text-slate-400 hover:text-purple-300 text-sm transition-colors">Analytics</a></li>
              <li><a href="/#features" className="text-slate-400 hover:text-purple-300 text-sm transition-colors">AI Insights</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2">
              {['About Us', 'Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Support'].map(link => (
                <li key={link}>
                  <a href="#" className="text-slate-400 hover:text-purple-300 text-sm transition-colors">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="neon-line mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm flex items-center gap-1">
            © 2025 EventAI. Made with <Heart size={12} className="text-rose-400 fill-rose-400" /> for extraordinary events.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-500 text-xs">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
