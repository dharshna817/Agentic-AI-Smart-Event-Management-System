import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, CheckCircle2, PencilLine, ShieldCheck, Sparkles } from 'lucide-react'

const formatDate = (value) => {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export default function SponsorReviewRequirementsPage() {
  const navigate = useNavigate()
  const { eventId, packageId } = useParams()
  const [event, setEvent] = useState(null)
  const [pkg, setPkg] = useState(null)
  const [requirements, setRequirements] = useState(null)
  const [terms, setTerms] = useState({ confirm: false, agree: false })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const canSubmit = terms.confirm && terms.agree

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

        const saved = JSON.parse(localStorage.getItem('eventai_sponsorship_requirement') || '{}')
        if (saved && saved.event_id) {
          setRequirements(saved)
        }
      } catch (error) {
        console.error('Unable to load review details:', error)
      }
    }

    load()
  }, [eventId, packageId])

  const handleSubmit = async () => {
    setHasAttemptedSubmit(true)
    if (!terms.confirm || !terms.agree) {
      setSubmitError('Please confirm the details and accept the sponsorship terms to continue.')
      return
    }

    const user = JSON.parse(localStorage.getItem('eventai_user') || '{}')
    const payload = {
      sponsor_id: Number(user.id || requirements?.sponsor_id || 0),
      event_id: Number(eventId),
      package_id: Number(packageId),
      requirement_id: Number(requirements?.id || 0),
      amount: Number(requirements?.amount || pkg?.price || 0),
      booth_required: Boolean(requirements?.booth_required),
      booth_preference: requirements?.booth_preference || 'Not Required',
      branding_requirements: requirements?.branding_requirements || [],
      promotional_sessions: Number(requirements?.promotional_sessions || 0),
      special_requirements: requirements?.special_requirements || '',
      status: 'Pending Review',
      submitted_at: new Date().toISOString(),
      notes: requirements?.special_requirements || '',
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const headers = { 'x-user-role': 'sponsor', 'x-user-email': user.email || '' }
      const response = await axios.post('/api/sponsor/proposals', payload, { headers })
      const proposalId = response.data?.proposal_id || 'SP-0000-0000'
      localStorage.setItem('eventai_last_proposal', JSON.stringify({
        proposalId,
        eventName: event.name,
        packageName: pkg.name,
        amount: payload.amount,
        status: 'Pending Review',
      }))
      navigate(`/sponsor/proposals/success/${proposalId}`)
    } catch (error) {
      console.error('Unable to submit sponsor proposal:', error)
      setSubmitError(error.response?.data?.message || 'Unable to submit sponsorship proposal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!event || !pkg || !requirements) {
    return (
      <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
        <div className="max-w-5xl mx-auto w-full px-4 py-12">
          <div className="glass rounded-3xl p-10 border border-white/10 text-center text-slate-400">Loading sponsorship review...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(`/sponsor/events/${eventId}/select-package/${packageId}/customize`)}
          className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold border border-white/10 text-slate-200 inline-flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={15} /> Edit Requirements
        </button>

        <div className="glass rounded-3xl p-6 sm:p-8 border border-emerald-500/20">
          <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-3">
            <ShieldCheck size={14} /> Review
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white">Sponsorship Request Review</h1>
          <p className="text-slate-400 mt-2">Confirm the sponsorship details before moving forward.</p>
        </div>

        <div className="grid gap-6 mt-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4 text-purple-300">
              <CheckCircle2 size={18} />
              <span className="font-semibold uppercase tracking-wider text-xs">Summary</span>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex justify-between gap-6 border-b border-white/10 pb-3">
                <span>Event</span>
                <span className="text-white text-right">{event.name}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/10 pb-3">
                <span>Package</span>
                <span className="text-white text-right">{pkg.name}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/10 pb-3">
                <span>Amount</span>
                <span className="text-white text-right">₹{Number(requirements.amount || pkg.price || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/10 pb-3">
                <span>Booth Required</span>
                <span className="text-white text-right">{requirements.booth_required ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/10 pb-3">
                <span>Booth Preference</span>
                <span className="text-white text-right">{requirements.booth_preference || 'Not Required'}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/10 pb-3">
                <span>Branding</span>
                <span className="text-white text-right">{requirements.branding_requirements?.length ? requirements.branding_requirements.join(', ') : 'None'}</span>
              </div>
              <div className="flex justify-between gap-6 border-b border-white/10 pb-3">
                <span>Promotional Sessions</span>
                <span className="text-white text-right">{requirements.promotional_sessions || 0}</span>
              </div>
              <div className="flex justify-between gap-6 pb-1">
                <span>Special Requirements</span>
                <span className="text-white text-right max-w-[250px]">{requirements.special_requirements || 'None provided'}</span>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-3 text-cyan-300">
                <Sparkles size={16} />
                <h2 className="font-orbitron text-lg text-white">Event Details</h2>
              </div>
              <div className="text-white font-semibold">{event.name}</div>
              <div className="mt-2 text-sm text-slate-300">{event.location}</div>
              <div className="mt-2 text-sm text-slate-400">{formatDate(event.start_date || event.date)}</div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-3 text-amber-300">
                <PencilLine size={16} />
                <h2 className="font-orbitron text-lg text-white">Terms & Confirmation</h2>
              </div>

              <div className="space-y-3 text-sm text-slate-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terms.confirm}
                    onChange={(e) => {
                      setTerms((current) => {
                        const nextTerms = { ...current, confirm: e.target.checked }
                        if (hasAttemptedSubmit && nextTerms.confirm && nextTerms.agree) {
                          setSubmitError('')
                        }
                        return nextTerms
                      })
                    }}
                    className="mt-1 h-4 w-4 accent-purple-500"
                  />
                  <span>I confirm that the sponsorship information provided is correct.</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terms.agree}
                    onChange={(e) => {
                      setTerms((current) => {
                        const nextTerms = { ...current, agree: e.target.checked }
                        if (hasAttemptedSubmit && nextTerms.confirm && nextTerms.agree) {
                          setSubmitError('')
                        }
                        return nextTerms
                      })
                    }}
                    className="mt-1 h-4 w-4 accent-purple-500"
                  />
                  <span>I agree to the event sponsorship terms and conditions.</span>
                </label>
              </div>

              {hasAttemptedSubmit && submitError && <div className="mt-4 text-red-300 text-xs">{submitError}</div>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              className="w-full rounded-xl px-4 py-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 btn-primary"
            >
              {submitting ? 'Submitting Proposal...' : 'Submit Sponsorship Proposal'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
