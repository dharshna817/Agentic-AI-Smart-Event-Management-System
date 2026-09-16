import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Building2, Check, CheckCircle2, Sparkles } from 'lucide-react'

export default function SponsorPackageSelectionPage() {
  const navigate = useNavigate()
  const { eventId, packageId } = useParams()
  const [event, setEvent] = useState(null)
  const [pkg, setPkg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPackage = async () => {
      setLoading(true)
      try {
        const user = JSON.parse(localStorage.getItem('eventai_user') || '{}')
        const headers = {
          'x-user-role': 'sponsor',
          'x-user-email': user.email || '',
        }

        const response = await axios.get(`/api/sponsor/events/${eventId}/packages/${packageId}`, { headers })
        setEvent(response.data.event)
        setPkg(response.data.package)
      } catch (error) {
        console.error('Failed to load selected sponsor package:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPackage()
  }, [eventId, packageId])

  const handleSelectPackage = () => {
    const selected = {
      eventId,
      packageId,
      packageName: pkg?.name || 'Package',
      packagePrice: pkg?.price || 0,
      eventName: event?.name || 'Event',
      eventDate: event?.start_date || event?.date,
      eventLocation: event?.location || 'TBD',
      selectedAt: new Date().toISOString(),
    }

    localStorage.setItem('eventai_selected_package', JSON.stringify(selected))
    navigate(`/sponsor/events/${eventId}/select-package/${packageId}/customize`)
  }

  const priceLabel = useMemo(() => {
    if (!pkg?.price && pkg?.price !== 0) return '₹0'
    return `₹${Number(pkg.price).toLocaleString('en-IN')}`
  }, [pkg])

  if (loading) {
    return (
      <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
        <div className="max-w-4xl mx-auto w-full px-4 py-12">
          <div className="glass rounded-3xl p-10 border border-white/10 text-center text-slate-400">Loading package details...</div>
        </div>
      </div>
    )
  }

  if (!pkg || !event) {
    return (
      <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
        <div className="max-w-4xl mx-auto w-full px-4 py-12">
          <div className="glass rounded-3xl p-10 border border-white/10 text-center space-y-4">
            <h1 className="font-orbitron text-2xl text-white">Package not found</h1>
            <button onClick={() => navigate(`/sponsor/events/${eventId}`)} className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold">Back to Event</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
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
          <h1 className="font-orbitron text-3xl font-bold text-white">{pkg.label || pkg.name}</h1>
          <p className="text-slate-400 mt-2">{event.name}</p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-purple-300">Price</div>
                <div className="font-orbitron text-3xl font-bold text-white mt-2">{priceLabel}</div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                {pkg.availability || 'Available'}
              </div>
            </div>

            <div className="text-slate-300 leading-relaxed mb-6">{pkg.description || 'Premium sponsorship package.'}</div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-purple-300" />
                <h2 className="font-orbitron text-xl font-bold text-white">Benefits</h2>
              </div>

              <ul className="space-y-3">
                {(pkg.benefits || []).map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-slate-300 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Availability</div>
            <div className="text-white font-semibold text-lg mb-6">{pkg.availability || 'Available'}</div>

            <button
              onClick={handleSelectPackage}
              className="w-full btn-primary rounded-xl px-4 py-3 text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <Check size={16} /> Select Package
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
