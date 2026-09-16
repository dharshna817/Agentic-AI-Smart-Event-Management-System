import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
    Lock,
    Mail,
    Building2,
    ArrowRight,
    Briefcase,
    Award,
    Sparkles,
} from 'lucide-react'
import Navbar from '../components/Navbar'

export default function SponsorLoginPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await axios.post('/api/sponsor/login', form)
            const user = response.data.user
            localStorage.setItem('eventai_user', JSON.stringify(user))
            axios.defaults.headers.common['x-user-role'] = user.role
            axios.defaults.headers.common['x-user-email'] = user.email
            toast.success(`Welcome back, ${user.company_name || 'Sponsor'}!`)
            navigate('/sponsor/dashboard')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Sponsor authentication failed')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = (e) => {
        e.preventDefault()
        toast.info('Please contact event support at support@eventai.local to reset your sponsor password.')
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 min-h-screen pt-24 pb-16 px-4"
        >
            <Navbar />
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Information Card */}
                <div className="glass rounded-3xl p-8 border border-purple-500/20">
                    <div className="inline-flex items-center gap-2 text-purple-300 text-xs font-medium mb-6 rounded-full border border-purple-500/30 px-3 py-1 bg-purple-500/10">
                        <Sparkles size={14} /> Sponsor Portal
                    </div>
                    <h1 className="font-orbitron text-3xl font-bold text-white mb-3">
                        Welcome Back, Sponsor
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        Login to manage your event sponsorships, track proposal statuses, deliverable progress, and financial summaries.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-2xl p-4 glass hover:border-purple-500/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Building2 size={18} className="text-purple-300" />
                            </div>
                            <div>
                                <div className="text-white font-semibold text-sm">Corporate Sponsorships</div>
                                <div className="text-slate-400 text-xs">
                                    Manage tiers, deliverables, brand exposure, and event partnerships
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl p-4 glass hover:border-cyan-500/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <Briefcase size={18} className="text-cyan-300" />
                            </div>
                            <div>
                                <div className="text-white font-semibold text-sm">Proposals & Analytics</div>
                                <div className="text-slate-400 text-xs">
                                    Submit sponsorship proposals and monitor engagement performance
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl p-4 glass hover:border-emerald-500/30 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <Award size={18} className="text-emerald-300" />
                            </div>
                            <div>
                                <div className="text-white font-semibold text-sm">Dedicated Portal</div>
                                <div className="text-slate-400 text-xs">
                                    Exclusive access restricted to authenticated sponsor accounts
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form Card */}
                <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="mb-6">
                        <h2 className="font-orbitron text-2xl font-bold text-white">Sponsor Portal Login</h2>
                        <p className="text-slate-400 text-xs mt-1">Enter your registered email and password to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-xs text-slate-300 mb-2 block font-medium">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="sponsor@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs text-slate-300 block font-medium">Password</label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="input-glass w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 hover:shadow-purple-700/50 transition-all"
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                            <ArrowRight size={16} />
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-slate-400 text-sm">
                            Don’t have a sponsor account?{' '}
                            <Link to="/sponsor/register" className="text-purple-300 font-medium hover:underline ml-1">
                                Create Sponsor Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
