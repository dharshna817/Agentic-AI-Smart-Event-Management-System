import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function AuthRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      toast.error('All fields are required.')
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/auth/register', form)
      toast.success(response.data.message || 'Registration successful.')
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 min-h-screen pt-24 pb-16 px-4">
      <Navbar />
      <div className="max-w-lg mx-auto glass rounded-3xl p-6 border border-white/10">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-300 text-sm mb-6">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Create your account</h1>
        <p className="text-slate-400 text-sm mb-6">Register as a user and continue to the event portal.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input name="name" value={form.name} onChange={handleChange} className="input-glass w-full pl-10 pr-4 py-3 rounded-xl" placeholder="Full name" required />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input-glass w-full pl-10 pr-4 py-3 rounded-xl" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Phone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="input-glass w-full pl-10 pr-4 py-3 rounded-xl" placeholder="Phone number" required />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input type="password" name="password" value={form.password} onChange={handleChange} className="input-glass w-full pl-10 pr-4 py-3 rounded-xl" placeholder="Password" required />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="input-glass w-full pl-10 pr-4 py-3 rounded-xl" placeholder="Confirm password" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full rounded-xl px-4 py-3 text-white font-medium">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-slate-400 text-sm mt-6 text-center">
          Already have an account? <Link to="/login" className="text-purple-300">Login</Link>
        </p>
      </div>
    </motion.div>
  )
}
