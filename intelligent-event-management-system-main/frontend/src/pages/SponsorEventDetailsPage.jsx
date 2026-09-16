import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, CalendarDays, MapPin, Users, Sparkles, Building2, Mail, Tag, CheckCircle2, BadgeCheck, Check, ChevronRight } from 'lucide-react'
import Navbar from '../components/Navbar'

const formatDate = (value) => {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const formatStatus = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return 'Upcoming'
  if (raw.toLowerCase() === 'open for sponsorship') return 'Open'
  if (raw.toLowerCase() === 'sponsorship closed') return 'Closed'
  return raw
}

export default function SponsorEventDetailsPage() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [packages, setPackages] = useState([])
  const [selectedPackages, setSelectedPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      try {
        const user = JSON.parse(localStorage.getItem('eventai_user') || '{}')
        const headers = {
          'x-user-role': 'sponsor',
          'x-user-email': user.email || '',
        }

        const [eventResponse, packagesResponse] = await Promise.all([
          axios.get(`/api/sponsor/events/${eventId}`, { headers }),
          axios.get(`/api/sponsor/events/${eventId}/packages`, { headers }),
        ])

        setEvent(eventResponse.data)
        setPackages(Array.isArray(packagesResponse.data) ? packagesResponse.data : [])
      } catch (error) {
        console.error('Failed to load sponsor event detail:', error)
        setEvent(null)
        setPackages([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const sponsorshipLevels = useMemo(() => {
    if (!event?.sponsorship_levels) return [
      { name: 'Platinum', status: 'Available' },
      { name: 'Gold', status: 'Available' },
      { name: 'Silver', status: 'Available' },
    ]

    return Object.entries(event.sponsorship_levels).map(([name, status]) => ({ name, status }))
  }, [event])

  const comparisonRows = useMemo(() => {
    const featureMap = {
      'Main Stage Branding': ['✓', '✓', '—'],
      'Promotional Session': ['✓', '—', '—'],
      'Exhibition Booth': ['✓', '✓', '—'],
      'Social Media Promotion': ['✓', '✓', '—'],
      'Complimentary Passes': ['5', '3', '2'],
    }

    return Object.entries(featureMap).map(([feature, values]) => ({ feature, values }))
  }, [])

  const togglePackage = (pkgName) => {
    setSelectedPackages((current) => current.includes(pkgName)
      ? current.filter((item) => item !== pkgName)
      : [...current, pkgName])
  }

  const handleCompare = () => {
    if (selectedPackages.length === 0) return
    const compare = packages.filter((pkgItem) => selectedPackages.includes(pkgItem.name))
    if (compare.length === 0) return
    localStorage.setItem('eventai_package_compare', JSON.stringify({ eventId, packages: compare }))
    navigate(`/sponsor/events/${eventId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
        <Navbar />
        <div className="max-w-6xl w-full mx-auto px-4 py-12">
          <div className="glass rounded-3xl p-10 border border-white/10 text-center text-slate-400">Loading event details...</div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
        <Navbar />
        <div className="max-w-6xl w-full mx-auto px-4 py-12">
          <div className="glass rounded-3xl p-10 border border-white/10 text-center space-y-4">
            <h1 className="font-orbitron text-2xl text-white">Event not found</h1>
            <p className="text-slate-400">This sponsored event could not be loaded.</p>
            <button onClick={() => navigate('/sponsor/events')} className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold">Back to Events</button>
          </div>
        </div>
      </div>
    )
  }

  const isOpen = String(event.sponsorship_status || '').toLowerCase() === 'open for sponsorship'

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
      <Navbar />

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate('/sponsor/events')}
          className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold border border-white/10 text-slate-200 inline-flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={15} /> Back to Events
        </button>

        <div className="glass rounded-3xl p-6 sm:p-8 border border-purple-500/20 mb-6">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 mb-3">
                <Building2 size={14} /> Sponsor Portal
              </div>
              <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white">{event.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-cyan-300" /> {formatDate(event.start_date || event.date)}</span>
                <span className="inline-flex items-center gap-2"><MapPin size={15} className="text-cyan-300" /> {event.location}</span>
              </div>
            </div>

            <div className="xl:text-right">
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${isOpen ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/80 text-slate-300 border-slate-600/70'}`}>
                {isOpen ? 'Open for Sponsorship' : formatStatus(event.sponsorship_status)}
              </div>
              <div className="mt-3 text-sm text-slate-400">Category: <span className="text-white font-medium">{event.category || 'Technology'}</span></div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-purple-300" />
                <h2 className="font-orbitron text-xl font-bold text-white">Event Description</h2>
              </div>
              <p className="text-slate-300 leading-relaxed">{event.description || 'Detailed event description will be shared here.'}</p>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-5">
                <Tag size={18} className="text-purple-300" />
                <h2 className="font-orbitron text-xl font-bold text-white">Event Highlights</h2>
              </div>

              <ul className="space-y-3">
                {(event.highlights || ['Industry Speakers', 'Startup Exhibition', 'Networking Sessions', 'Technology Showcase', 'Product Demonstrations']).map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3 text-slate-300 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-5">
                <BadgeCheck size={18} className="text-purple-300" />
                <h2 className="font-orbitron text-xl font-bold text-white">Available Sponsorship Packages</h2>
              </div>

              <div className="space-y-4">
                {packages.length > 0 ? packages.map((pkg) => (
                  <div key={pkg.package_id || pkg.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-purple-300 font-semibold">{pkg.name}</div>
                        <div className="font-orbitron text-2xl text-white mt-2">₹{Number(pkg.price || 0).toLocaleString('en-IN')}</div>
                        <p className="text-slate-400 text-sm mt-2">{pkg.description || 'Premium sponsorship package'}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/sponsor/events/${eventId}/select-package/${pkg.package_id || pkg.id}`)}
                          className="btn-ghost rounded-xl px-3 py-2 text-[11px] font-semibold border border-white/10 text-slate-200"
                        >
                          View Package
                        </button>
                        <button
                          onClick={() => navigate(`/sponsor/events/${eventId}/select-package/${pkg.package_id || pkg.id}`)}
                          className="btn-primary rounded-xl px-3 py-2 text-[11px] font-semibold"
                        >
                          Select Package
                        </button>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                      {(pkg.benefits || []).map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2"><Check size={14} className="text-emerald-400 mt-0.5" /> {benefit}</li>
                      ))}
                    </ul>

                    <div className="mt-4 text-xs uppercase tracking-wider text-emerald-300 font-semibold">{pkg.availability || 'Available'}</div>
                  </div>
                )) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {sponsorshipLevels.map((tier) => (
                      <div key={tier.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">{tier.name}</div>
                        <div className={`text-sm font-semibold ${String(tier.status || '').toLowerCase() === 'available' ? 'text-emerald-300' : 'text-slate-300'}`}>
                          {tier.status || 'Available'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-5">
                <BadgeCheck size={18} className="text-purple-300" />
                <h2 className="font-orbitron text-xl font-bold text-white">Compare Packages</h2>
              </div>

              <div className="space-y-3 mb-5">
                {['Platinum', 'Gold', 'Silver'].map((name) => (
                  <label key={name} className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(name)}
                      onChange={() => togglePackage(name)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-900 text-purple-500 focus:ring-purple-500"
                    />
                    {name}
                  </label>
                ))}
              </div>

              <button
                onClick={handleCompare}
                disabled={selectedPackages.length === 0}
                className="btn-primary rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Compare Packages
              </button>

              {selectedPackages.length > 0 && (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
                  <table className="min-w-full text-left text-sm text-slate-300">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-3">Feature</th>
                        <th className="p-3">Platinum</th>
                        <th className="p-3">Gold</th>
                        <th className="p-3">Silver</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/10">
                        <td className="p-3 font-medium text-white">Price</td>
                        <td className="p-3">₹5,00,000</td>
                        <td className="p-3">₹3,00,000</td>
                        <td className="p-3">₹1,50,000</td>
                      </tr>
                      {comparisonRows.map((row) => (
                        <tr key={row.feature} className="border-b border-white/10">
                          <td className="p-3 font-medium text-white">{row.feature}</td>
                          <td className="p-3">{row.values[0]}</td>
                          <td className="p-3">{row.values[1]}</td>
                          <td className="p-3">{row.values[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <h2 className="font-orbitron text-xl font-bold text-white mb-4">Event Information</h2>

              <div className="space-y-3">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Event Date</div>
                  <div className="text-white font-semibold mt-1">{formatDate(event.start_date || event.date)}</div>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Location</div>
                  <div className="text-white font-semibold mt-1">{event.location}</div>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Expected Attendees</div>
                  <div className="text-white font-semibold mt-1">{event.expected_attendees ?? 'N/A'}</div>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Event Category</div>
                  <div className="text-white font-semibold mt-1">{event.category || 'Technology'}</div>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Sponsorship Status</div>
                  <div className="text-white font-semibold mt-1">{formatStatus(event.sponsorship_status)}</div>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Mail size={18} className="text-purple-300" />
                <h2 className="font-orbitron text-xl font-bold text-white">Event Contact</h2>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Event Organizer</div>
                  <div className="text-white font-medium mt-1">{event.organizer_name || 'Organizer Name'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Contact</div>
                  <div className="text-cyan-300 mt-1">{event.organizer_email || 'organizer@example.com'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
