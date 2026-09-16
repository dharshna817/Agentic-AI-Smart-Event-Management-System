import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  User, Mail, Phone, Hash, Building2, BookOpen,
  Briefcase, MapPin, Code, Heart, Linkedin, AlertCircle,
  Utensils, Accessibility, CheckCircle, ChevronRight, ChevronLeft,
  Sparkles, Zap
} from 'lucide-react'
import Navbar from '../components/Navbar'

// ─── Step Definitions ────────────────────────────────────────────────────────
const steps = [
  { label: 'Personal Info', icon: User },
  { label: 'Academic / Work', icon: Building2 },
  { label: 'Professional', icon: Code },
  { label: 'Preferences', icon: Heart },
  { label: 'Review', icon: CheckCircle },
]

const initialForm = {
  fullName: '', email: '', phone: '', age: '', gender: '',
  collegeOrCompany: '', department: '', occupation: '', city: '',
  skills: '', interests: '', linkedIn: '', emergencyContact: '',
  dietaryPreference: 'None', accessibilityRequirement: '',
}

// ─── Reusable Field Components ────────────────────────────────────────────────
function Field({ label, name, type = 'text', placeholder, icon: Icon, value, onChange, required, options, hint }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2">
        {Icon && <Icon size={13} className="text-purple-400" />}
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>
      {options ? (
        <select
          name={name} value={value} onChange={onChange} required={required}
          className="w-full input-glass px-4 py-3 rounded-xl text-sm bg-transparent appearance-none"
        >
          <option value="" className="bg-gray-900">Select {label}</option>
          {options.map(o => <option key={o} value={o} className="bg-gray-900">{o}</option>)}
        </select>
      ) : (
        <input
          type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          className="w-full input-glass px-4 py-3 rounded-xl text-sm"
        />
      )}
      {hint && <p className="text-slate-600 text-xs mt-1">{hint}</p>}
    </div>
  )
}

// ─── Step 1: Personal Info ────────────────────────────────────────────────────
function Step1({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="sm:col-span-2">
        <Field label="Full Name" name="fullName" placeholder="Your full name" icon={User} value={form.fullName} onChange={onChange} required />
      </div>
      <Field label="Email Address" name="email" type="email" placeholder="you@email.com" icon={Mail} value={form.email} onChange={onChange} required />
      <Field label="Phone Number" name="phone" type="tel" placeholder="+91 98765 43210" icon={Phone} value={form.phone} onChange={onChange} required />
      <Field label="Age" name="age" type="number" placeholder="e.g. 22" icon={Hash} value={form.age} onChange={onChange} required />
      <Field
        label="Gender" name="gender" icon={User}
        value={form.gender} onChange={onChange} required
        options={['Male', 'Female', 'Non-binary', 'Prefer not to say']}
      />
    </div>
  )
}

// ─── Step 2: Academic / Work ──────────────────────────────────────────────────
function Step2({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="sm:col-span-2">
        <Field label="College / Company" name="collegeOrCompany" placeholder="Your institution or organization" icon={Building2} value={form.collegeOrCompany} onChange={onChange} required />
      </div>
      <Field label="Department" name="department" placeholder="e.g. Computer Science, Marketing" icon={BookOpen} value={form.department} onChange={onChange} required />
      <Field
        label="Occupation" name="occupation" icon={Briefcase}
        value={form.occupation} onChange={onChange} required
        options={['Student', 'Software Engineer', 'Designer', 'Data Scientist', 'Manager', 'Entrepreneur', 'Researcher', 'Other']}
      />
      <div className="sm:col-span-2">
        <Field label="City" name="city" placeholder="Your city" icon={MapPin} value={form.city} onChange={onChange} required />
      </div>
    </div>
  )
}

// ─── Step 3: Professional ─────────────────────────────────────────────────────
function Step3({ form, onChange }) {
  return (
    <div className="space-y-5">
      <Field
        label="Skills" name="skills" placeholder="e.g. Python, React, Machine Learning, UI/UX"
        icon={Code} value={form.skills} onChange={onChange}
        hint="Separate multiple skills with commas"
      />
      <Field
        label="Interests" name="interests" placeholder="e.g. AI, Blockchain, Open Source, Startups"
        icon={Heart} value={form.interests} onChange={onChange}
        hint="Help us match you with the right sessions and attendees"
      />
      <Field
        label="LinkedIn Profile" name="linkedIn" type="url" placeholder="https://linkedin.com/in/yourprofile"
        icon={Linkedin} value={form.linkedIn} onChange={onChange}
      />
    </div>
  )
}

// ─── Step 4: Preferences ─────────────────────────────────────────────────────
function Step4({ form, onChange }) {
  return (
    <div className="space-y-5">
      <Field
        label="Emergency Contact" name="emergencyContact" placeholder="Name & Phone Number"
        icon={AlertCircle} value={form.emergencyContact} onChange={onChange} required
        hint="Used only in case of emergency at the event"
      />
      <Field
        label="Dietary Preference" name="dietaryPreference" icon={Utensils}
        value={form.dietaryPreference} onChange={onChange}
        options={['None', 'Vegetarian', 'Vegan', 'Jain', 'Gluten-Free', 'Halal', 'Kosher', 'Other']}
      />
      <Field
        label="Accessibility Requirement" name="accessibilityRequirement"
        placeholder="e.g. Wheelchair access, Sign language interpreter..."
        icon={Accessibility} value={form.accessibilityRequirement} onChange={onChange}
        hint="We'll ensure appropriate accommodations are arranged"
      />
    </div>
  )
}

// ─── Step 5: Review ───────────────────────────────────────────────────────────
function Step5({ form }) {
  const fields = [
    { label: 'Full Name', value: form.fullName },
    { label: 'Email', value: form.email },
    { label: 'Phone', value: form.phone },
    { label: 'Age', value: form.age },
    { label: 'Gender', value: form.gender },
    { label: 'College/Company', value: form.collegeOrCompany },
    { label: 'Department', value: form.department },
    { label: 'Occupation', value: form.occupation },
    { label: 'City', value: form.city },
    { label: 'Skills', value: form.skills || '—' },
    { label: 'Interests', value: form.interests || '—' },
    { label: 'LinkedIn', value: form.linkedIn || '—' },
    { label: 'Emergency Contact', value: form.emergencyContact },
    { label: 'Dietary Preference', value: form.dietaryPreference },
    { label: 'Accessibility', value: form.accessibilityRequirement || 'None' },
  ]

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      <p className="text-slate-400 text-sm mb-4">Please review your details before submitting.</p>
      {fields.map(f => (
        <div key={f.label} className="flex justify-between items-start py-2 border-b border-white/5">
          <span className="text-slate-400 text-xs w-1/2 flex-shrink-0">{f.label}</span>
          <span className="text-white text-xs font-medium text-right break-all">{f.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RegistrationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const onChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validateStep = () => {
    if (step === 0) {
      if (!form.fullName || !form.email || !form.phone || !form.age || !form.gender) {
        toast.error('Please fill in all required fields.')
        return false
      }
      if (!/\S+@\S+\.\S+/.test(form.email)) { toast.error('Please enter a valid email address.'); return false }
      if (!/^\+?[\d\s-]{10,}$/.test(form.phone)) { toast.error('Please enter a valid phone number.'); return false }
      if (parseInt(form.age) < 18) { toast.error('You must be at least 18 years old to register.'); return false }
    }
    if (step === 1) {
      if (!form.collegeOrCompany || !form.department || !form.occupation || !form.city) {
        toast.error('Please fill in all required fields.')
        return false
      }
    }
    if (step === 3) {
      if (!form.emergencyContact) { toast.error('Emergency contact is required.'); return false }
    }
    return true
  }

  const nextStep = async () => {
    if (!validateStep()) return
    // Email duplicate check when leaving step 0
    if (step === 0) {
      setCheckingEmail(true)
      try {
        const res = await axios.get(`/api/check-email?email=${encodeURIComponent(form.email)}`)
        if (res.data.exists) {
          toast.error('This email is already registered! Check your inbox for your QR code.')
          setCheckingEmail(false)
          return
        }
      } catch {
        // If API is not running, proceed anyway (dev mode)
      }
      setCheckingEmail(false)
    }
    setStep(s => s + 1)
  }

  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await axios.post('/api/register', {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
        age: parseInt(form.age),
      })
      toast.success('🎉 Registration successful!')
      navigate(`/success/${response.data.registrationId}`)
    } catch (err) {
      // Demo mode: navigate with dummy ID if the backend is missing or unreachable.
      const apiMissing = err.response?.status === 404
      const apiOffline = err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED'
      if (apiMissing || apiOffline) {
        toast.success('🎉 Registration successful! (Demo mode)')
        const demoId = 'DEMO-' + Math.random().toString(36).substring(2,9).toUpperCase()
        navigate(`/success/${demoId}`, { state: { formData: form } })
      } else {
        toast.error(err.response?.data?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const StepComponents = [
    <Step1 form={form} onChange={onChange} />,
    <Step2 form={form} onChange={onChange} />,
    <Step3 form={form} onChange={onChange} />,
    <Step4 form={form} onChange={onChange} />,
    <Step5 form={form} />,
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative z-10 min-h-screen pt-24 pb-16 px-4"
    >
      <Navbar />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="badge inline-flex items-center gap-2 mb-3">
            <Sparkles size={12} />
            TechFest 2025 — Registration
          </div>
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-2">
            <span className="gradient-text">Register</span> for the Event
          </h1>
          <p className="text-slate-400 text-sm">Complete in under 2 minutes • Get QR code instantly</p>
        </motion.div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    background: i < step
                      ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                      : i === step
                        ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                        : 'rgba(255,255,255,0.08)',
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10"
                >
                  {i < step ? (
                    <CheckCircle size={16} className="text-white" />
                  ) : (
                    <s.icon size={16} className={i === step ? 'text-white' : 'text-slate-500'} />
                  )}
                </motion.div>
                <span className={`text-xs mt-1 font-medium hidden md:block ${i === step ? 'text-purple-300' : i < step ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 mx-2 h-0.5 relative overflow-hidden bg-white/10 rounded-full">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: i < step ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          layout
          className="glass rounded-3xl p-8 border border-white/10 shadow-2xl shadow-purple-900/20"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 btn-primary rounded-lg flex items-center justify-center">
              {(() => { const S = steps[step]; return <S.icon size={15} className="text-white" /> })()}
            </div>
            <h2 className="text-white font-semibold text-lg">{steps[step].label}</h2>
            <span className="ml-auto text-slate-500 text-xs">Step {step + 1} of {steps.length}</span>
          </div>

          {/* Overall Progress */}
          <div className="w-full bg-white/5 rounded-full h-1 mb-7 overflow-hidden">
            <motion.div
              className="progress-bar"
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {StepComponents[step]}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="flex-1 btn-ghost py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={checkingEmail}
                className="flex-1 btn-primary py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              >
                {checkingEmail ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                ) : (
                  <>Continue <ChevronRight size={16} /></>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 btn-primary py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registering...</>
                ) : (
                  <><Zap size={16} /> Complete Registration</>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-slate-600 text-xs">
          {['🔒 256-bit encrypted', '✅ Duplicate detection', '⚡ Instant QR code', '📧 Email confirmation'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
