import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap, LogIn, UserPlus, LogOut, LayoutDashboard, UserCircle2, Building2 } from 'lucide-react'

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#highlights', label: 'Highlights' },
  { href: '/#testimonials', label: 'Testimonials' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isActive = (path) => location.pathname === path

  let currentUser = null
  try {
    currentUser = JSON.parse(localStorage.getItem('eventai_user') || 'null')
  } catch (error) {
    currentUser = null
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('eventai_user')
    navigate('/')
  }

  const renderAuthButtons = () => {
    if (!currentUser) {
      return (
        <>
          <Link to="/sponsor/login" className="flex items-center gap-1.5 px-3 py-2 btn-ghost rounded-xl text-xs font-semibold text-purple-300 border border-purple-500/30 hover:border-purple-400">
            <Building2 size={14} />
            Sponsor Portal
          </Link>
          <Link to="/login" className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-xl text-sm">
            <LogIn size={15} />
            Login
          </Link>
          <Link to="/register" className="flex items-center gap-2 px-5 py-2 btn-primary rounded-xl text-sm">
            <UserPlus size={15} />
            Register Now
          </Link>
        </>
      )
    }

    if (currentUser.role === 'sponsor') {
      return (
        <>
          <Link to="/sponsor/dashboard" className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-xl text-sm text-purple-300 border border-purple-500/30">
            <Building2 size={15} />
            Sponsor Dashboard
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-xl text-sm">
            <LogOut size={15} />
            Logout
          </button>
        </>
      )
    }

    if (currentUser.role === 'user') {
      return (
        <>
          <Link to="/user/dashboard" className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-xl text-sm">
            <UserCircle2 size={15} />
            My Events
          </Link>
          <Link to="/user/dashboard" className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-xl text-sm">
            <UserCircle2 size={15} />
            Profile
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-xl text-sm">
            <LogOut size={15} />
            Logout
          </button>
        </>
      )
    }

    return (
      <>
        <Link to="/admin/dashboard" className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-xl text-sm">
          <LayoutDashboard size={15} />
          Admin Dashboard
        </Link>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-xl text-sm">
          <LogOut size={15} />
          Logout
        </button>
      </>
    )
  }

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-dark shadow-lg shadow-purple-900/20 py-3' : 'bg-transparent py-5'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center glow-purple">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-orbitron font-bold text-lg gradient-text">EventAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200 hover:text-purple-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {renderAuthButtons()}
          </div>

          <button
            className="md:hidden text-white p-2 glass rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass-dark border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-300 hover:text-white py-2 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="neon-line my-2" />
              {currentUser ? (
                <>
                  {currentUser.role === 'user' ? (
                    <>
                      <Link to="/user/dashboard" className="btn-ghost rounded-xl px-4 py-2 text-sm text-center">My Events</Link>
                      <Link to="/user/dashboard" className="btn-ghost rounded-xl px-4 py-2 text-sm text-center">Profile</Link>
                    </>
                  ) : (
                    <Link to="/admin/dashboard" className="btn-ghost rounded-xl px-4 py-2 text-sm text-center">Admin Dashboard</Link>
                  )}
                  <button onClick={handleLogout} className="btn-ghost rounded-xl px-4 py-2 text-sm text-center">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost rounded-xl px-4 py-2 text-sm text-center">Login</Link>
                  <Link to="/register" className="btn-primary rounded-xl px-4 py-2 text-sm text-center">Register Now</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
