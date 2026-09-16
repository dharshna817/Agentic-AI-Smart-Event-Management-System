import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Building2, CalendarDays, MapPin, Save, Sparkles, CheckCircle2 } from 'lucide-react'

const formatDate = (value) => {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const boothOptions = ['Standard', 'Premium', 'Near Entrance', 'Near Main Stage']
const brandingOptions = ['Main Stage', 'Entrance', 'Exhibition Area', 'Digital Screens', 'Social Media']

export default function SponsorCustomizeRequirementsPage() {
  const navigate = useNavigate()
  const { eventId, packageId } = useParams()
  const [event, setEvent] = useState(null)
  const [pkg, setPkg] = useState(null)
  const [form, setForm] = useState({
    boothRequired: 'yes',
    boothPreference: 'Premium',
    brandingRequirements: [],
    promotionalSessions: 0,
    specialRequirements: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('eventai_user') || '{}')
        const headers = { 'x-user-role': 'sponsor', 'x-user-email': user.email || '' }

        const [eventRes, packageRes] = await Promise.all([
          axios.get(`/api/sponsor/events/${eventId}`, { headers }),
          axios.get(`/api/sponsor/events/${eventId}/packages/${packageId}`, { headers }),
        ])

        setEvent(eventRes.data)
        setPkg(packageRes.data.package || packageRes.data)

        const selectedPackage = JSON.parse(localStorage.getItem('eventai_selected_package') || '{}')
        if (selectedPackage.packageName) {
          setForm((prev) => ({
            ...prev,
            boothPreference: prev.boothPreference || 'Premium',
          }))
        }
      } catch (error) {
        console.error('Failed to load selected package details:', error)
      }
    }

    load()
  }, [eventId, packageId])

  const baseAmount = useMemo(() => Number(pkg?.price || 0), [pkg])

  const summary = useMemo(() => {
    const selectedBranding = form.brandingRequirements.length ? form.brandingRequirements.join(', ') : 'None'
    const boothText = form.boothRequired === 'yes' ? (form.boothPreference || 'Premium') : 'No'

    return {
      event: event?.name || 'Selected Event',
      packageName: pkg?.name || 'Selected Package',
      amount: baseAmount,
      booth: boothText,
      branding: selectedBranding,
      sessions: form.promotionalSessions || 0,
      specialRequirements: form.specialRequirements || 'None',
    }
  }, [baseAmount, event, form, pkg])

  const validate = () => {
    const nextErrors = {}

    if (!event) nextErrors.event = 'Event is missing.'
    if (!pkg) nextErrors.package = 'Package is missing.'
    if (Number(form.promotionalSessions) < 0) nextErrors.promotionalSessions = 'Promotional sessions cannot be negative.'
    if (form.boothRequired === 'yes' && !form.boothPreference) nextErrors.boothPreference = 'Please select a booth preference.'
    if (form.specialRequirements.trim() && form.specialRequirements.trim().length < 5) nextErrors.specialRequirements = 'Special requirements must be at least 5 characters.'
    if (!form.boothRequired) nextErrors.boothRequired = 'Please select whether a booth is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    const storedUser = JSON.parse(localStorage.getItem('eventai_user') || '{}')
    const userEmail = storedUser.email || ''

    if (!storedUser || !userEmail) {
      setErrors({ submit: 'Sponsor session expired. Please log in again.' })
      navigate('/sponsor/login')
      return
    }

    const payload = {
      sponsor_id: storedUser.id || 0,
      event_id: Number(eventId),
      package_id: Number(packageId),
      amount: Number(baseAmount),
      booth_required: form.boothRequired === 'yes',
      booth_preference: form.boothRequired === 'yes' ? form.boothPreference : 'Not Required',
      branding_requirements: form.brandingRequirements,
      promotional_sessions: Number(form.promotionalSessions || 0),
      special_requirements: form.specialRequirements.trim(),
    }

    setSaving(true)
    try {
      const headers = {'x-user-role': 'sponsor', 'x-user-email': userEmail}
      const response = await axios.post('/api/sponsor/sponsorship-requirements', payload, { headers })
      localStorage.setItem('eventai_sponsorship_requirement', JSON.stringify({
        id: response.data?.id || Date.now(),
        ...payload,
      }))
      navigate(`/sponsor/events/${eventId}/select-package/${packageId}/review`)
    } catch (error) {
      console.error('Failed to save sponsorship requirements:', error)
      const failureMessage = error.response?.data?.message || 'Unable to save sponsorship requirements. Please try again.'
      setErrors({ submit: failureMessage })
    } finally {
      setSaving(false)
    }
  }

  const toggleBranding = (value) => {
    setForm((current) => ({
      ...current,
      brandingRequirements: current.brandingRequirements.includes(value)
        ? current.brandingRequirements.filter((item) => item !== value)
        : [...current.brandingRequirements, value],
    }))
  }

  if (!event || !pkg) {
    return (
      <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
        <div className="max-w-5xl mx-auto w-full px-4 py-12">
          <div className="glass rounded-3xl p-10 border border-white/10 text-center text-slate-400">Loading sponsorship requirements...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(`/sponsor/events/${eventId}`)}
          className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold border border-white/10 text-slate-200 inline-flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={15} /> Back to Event Details
        </button>

        <div className="glass rounded-3xl p-6 sm:p-8 border border-purple-500/20 mb-6">
          <div className="inline-flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 mb-3">
            <Building2 size={14} /> Sponsor Portal
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white">Customize Requirements</h1>
          <p className="text-slate-400 mt-2">Tailor your sponsorship ask for {event.name}</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass rounded-3xl p-6 border border-white/10 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Selected Sponsorship Package</div>
              <div className="mt-2 font-orbitron text-2xl text-white">{pkg.name}</div>
              <div className="mt-1 text-purple-300 font-semibold">₹{Number(baseAmount).toLocaleString('en-IN')}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">Contribution</label>
                <div className="input-glass rounded-xl px-4 py-3 text-white font-semibold">₹{Number(baseAmount).toLocaleString('en-IN')}</div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">Booth Required</label>
                <div className="flex items-center gap-6">
                  {['yes', 'no'].map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="boothRequired"
                        checked={form.boothRequired === option}
                        onChange={() => setForm({ ...form, boothRequired: option })}
                        className="h-4 w-4 accent-purple-500"
                      />
                      {option === 'yes' ? 'Yes' : 'No'}
                    </label>
                  ))}
                </div>
                {errors.boothRequired && <div className="text-red-300 text-xs mt-1">{errors.boothRequired}</div>}
              </div>

              {form.boothRequired === 'yes' && (
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-2">Booth Preference</label>
                  <select
                    value={form.boothPreference}
                    onChange={(e) => setForm({ ...form, boothPreference: e.target.value })}
                    className="input-glass w-full px-4 py-3 rounded-xl text-white"
                  >
                    {boothOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.boothPreference && <div className="text-red-300 text-xs mt-1">{errors.boothPreference}</div>}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">Branding Requirements</label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {brandingOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer p-2 rounded-xl border border-white/10 bg-white/5">
                      <input
                        type="checkbox"
                        checked={form.brandingRequirements.includes(option)}
                        onChange={() => toggleBranding(option)}
                        className="h-4 w-4 accent-purple-500"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">Promotional Session</label>
                <input
                  type="number"
                  min="0"
                  value={form.promotionalSessions}
                  onChange={(e) => setForm({ ...form, promotionalSessions: Number(e.target.value) || 0 })}
                  className="input-glass w-full px-4 py-3 rounded-xl text-white"
                />
                {errors.promotionalSessions && <div className="text-red-300 text-xs mt-1">{errors.promotionalSessions}</div>}
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">Special Requirements</label>
                <textarea
                  rows="4"
                  value={form.specialRequirements}
                  onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
                  placeholder="Enter any special sponsorship requirements..."
                  className="input-glass w-full px-4 py-3 rounded-xl text-white resize-none"
                />
                {errors.specialRequirements && <div className="text-red-300 text-xs mt-1">{errors.specialRequirements}</div>}
              </div>

              {errors.submit && <div className="text-red-300 text-xs">{errors.submit}</div>}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-purple-300" />
                <h2 className="font-orbitron text-lg font-bold text-white">Sponsorship Summary</h2>
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div><span className="text-slate-400">Event:</span> <span className="text-white">{summary.event}</span></div>
                <div><span className="text-slate-400">Package:</span> <span className="text-white">{summary.packageName}</span></div>
                <div><span className="text-slate-400">Base Amount:</span> <span className="text-white">₹{summary.amount.toLocaleString('en-IN')}</span></div>
                <div><span className="text-slate-400">Booth:</span> <span className="text-white">{summary.booth}</span></div>
                <div><span className="text-slate-400">Branding:</span> <span className="text-white">{summary.branding}</span></div>
                <div><span className="text-slate-400">Promotional Sessions:</span> <span className="text-white">{summary.sessions}</span></div>
                <div><span className="text-slate-400">Special Requirements:</span> <span className="text-white">{summary.specialRequirements}</span></div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={16} className="text-cyan-300" />
                <div className="text-white font-medium">{event.name}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPin size={14} className="text-cyan-300" /> {event.location}
              </div>
              <div className="mt-2 text-sm text-slate-300">{formatDate(event.start_date || event.date)}</div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-primary rounded-xl px-4 py-3 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Save size={15} /> {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
