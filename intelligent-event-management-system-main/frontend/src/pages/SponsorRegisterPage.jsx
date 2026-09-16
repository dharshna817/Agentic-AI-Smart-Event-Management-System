import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
    Building2,
    User,
    Mail,
    Phone,
    Briefcase,
    Globe,
    Lock,
    ArrowRight,
    Sparkles,
    CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'

export default function SponsorRegisterPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        industry: '',
        website: '',
        password: '',
        confirmPassword: '',
    })
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            const response = await axios.post('/api/sponsor/register', form)
            toast.success(response.data.message || 'Sponsor registration successful!')
            navigate('/sponsor/login')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Sponsor registration failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 min-h-screen pt-24 pb-16 px-4"
        >
            <Navbar />
            <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-8 items-start">
                {/* Sidebar Info Banner */}
                <div className="lg:col-span-4 glass rounded-3xl p-6 border border-purple-500/20 sticky top-28">
                    <div className="inline-flex items-center gap-2 text-purple-300 text-xs font-medium mb-4 rounded-full border border-purple-500/30 px-3 py-1 bg-purple-500/10">
                        <Sparkles size={14} /> Partner With Us
                    </div>
                    <h1 className="font-orbitron text-2xl font-bold text-white mb-3">
                        Sponsor Registration
                    </h1>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6">
                        Register your organization to explore exclusive event sponsorship packages, present proposals, and track deliverables.
                    </p>

                    <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-300">Dedicated Sponsor Dashboard & Profile</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-300">Direct Proposal Submission & Status Tracking</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-300">Transparent Deliverables & Financial Summaries</span>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <div className="lg:col-span-8 glass rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="font-orbitron text-xl font-bold text-white">Create Sponsor Account</h2>
                        <p className="text-slate-400 text-xs mt-1">Please fill in your company and contact details below</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Company Name *</label>
                                <div className="relative">
                                    <Building2 size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={handleChange}
                                        className="input-glass w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm"
                                        placeholder="e.g. ABC Technologies"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Contact Person *</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={form.contactPerson}
                                        onChange={handleChange}
                                        className="input-glass w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm"
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Corporate Email *</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="input-glass w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm"
                                        placeholder="sponsor@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Phone Number *</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="input-glass w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm"
                                        placeholder="+91 9876543210"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Industry *</label>
                                <div className="relative">
                                    <Briefcase size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="industry"
                                        value={form.industry}
                                        onChange={handleChange}
                                        className="input-glass w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm"
                                        placeholder="e.g. Information Technology"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Company Website</label>
                                <div className="relative">
                                    <Globe size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="url"
                                        name="website"
                                        value={form.website}
                                        onChange={handleChange}
                                        className="input-glass w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm"
                                        placeholder="https://company.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Password *</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        className="input-glass w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm"
                                        placeholder="At least 8 chars, 1 upper, 1 special"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-300 mb-1.5 block font-medium">Confirm Password *</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        className="input-glass w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm"
                                        placeholder="Repeat password"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full rounded-xl px-4 py-3.5 mt-2 flex items-center justify-center gap-2 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 hover:shadow-purple-700/50 transition-all"
                        >
                            {loading ? 'Creating Account...' : 'Create Sponsor Account'}
                            <ArrowRight size={16} />
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-white/10 text-center">
                        <p className="text-slate-400 text-sm">
                            Already have a sponsor account?{' '}
                            <Link to="/sponsor/login" className="text-purple-300 font-medium hover:underline ml-1">
                                Sponsor Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
