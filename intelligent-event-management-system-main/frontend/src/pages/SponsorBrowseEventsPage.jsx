import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { ArrowLeft, Calendar, MapPin, Users, Search, Filter, Building2, Sparkles, Eye } from 'lucide-react'
import Navbar from '../components/Navbar'

const categoryOptions = ['Technology', 'Business', 'Education', 'Healthcare', 'AI', 'Startup', 'Other']

const formatDate = (value) => {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

const formatStatusLabel = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return 'Upcoming'
  if (raw.toLowerCase() === 'sponsorship closed') return 'Sponsorship Closed'
  if (raw.toLowerCase() === 'open for sponsorship') return 'Open for Sponsorship'
  return raw
}

export default function SponsorBrowseEventsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [location, setLocation] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const user = JSON.parse(localStorage.getItem('eventai_user') || '{}')
        const headers = {
          'x-user-role': 'sponsor',
          'x-user-email': user.email || '',
        }
        const response = await axios.get('/api/sponsor/events', { headers })
        setEvents(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Failed to load sponsor events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const locations = useMemo(() => {
    const unique = [...new Set(events.map((event) => event.location).filter(Boolean))]
    return unique.sort()
  }, [events])

  const filteredEvents = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return events.filter((event) => {
      const matchesSearch = !searchText ||
        String(event.name || '').toLowerCase().includes(searchText) ||
        String(event.category || '').toLowerCase().includes(searchText) ||
        String(event.location || '').toLowerCase().includes(searchText)

      const matchesCategory = category === 'All' || event.category === category
      const matchesLocation = location === 'All' || event.location === location
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Open for Sponsorship' && String(event.sponsorship_status || '').toLowerCase() === 'open for sponsorship') ||
        (statusFilter === 'Sponsorship Closed' && String(event.sponsorship_status || '').toLowerCase() === 'sponsorship closed')

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus
    })
  }, [events, search, category, location, statusFilter])

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 mb-3">
              <Building2 size={14} /> Sponsor Portal
            </div>
            <h1 className="font-orbitron text-3xl font-bold text-white">Browse Events</h1>
            <p className="text-slate-400 text-sm mt-1">Explore events available for sponsorship and partnership opportunities.</p>
          </div>

          <button
            onClick={() => navigate('/sponsor/dashboard')}
            className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold border border-white/10 text-slate-200 inline-flex items-center gap-2"
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
        </div>

        <div className="glass rounded-3xl p-5 border border-purple-500/20 mb-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-slate-900/70 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-white/10 bg-slate-900/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <option value="All">All</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-white/10 bg-slate-900/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <option value="All">All</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-white/10 bg-slate-900/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <option value="All">All</option>
                <option value="Open for Sponsorship">Open for Sponsorship</option>
                <option value="Sponsorship Closed">Sponsorship Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Filter size={15} className="text-purple-300" />
            <span>{filteredEvents.length} available event{filteredEvents.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-3xl p-10 border border-white/10 text-center text-slate-400">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass rounded-3xl p-10 border border-white/10 text-center text-slate-300">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-purple-300" />
            </div>
            <h3 className="font-orbitron text-xl font-bold text-white mb-2">No matching events found</h3>
            <p className="text-slate-400">Try a different search or filter to view sponsorship opportunities.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => {
              const isOpen = String(event.sponsorship_status || '').toLowerCase() === 'open for sponsorship'

              return (
                <motion.div
                  key={event.event_id || event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-3xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all h-full flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-purple-300 text-[10px] uppercase tracking-[0.18em] font-semibold">{event.category || 'Technology'}</p>
                      <h2 className="font-orbitron text-xl font-bold text-white mt-2">{event.name}</h2>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${isOpen ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-700/80 text-slate-300 border-slate-600/70'}`}>
                      {isOpen ? 'Open for Sponsorship' : formatStatusLabel(event.sponsorship_status)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-cyan-300" />
                      <span>{formatDate(event.start_date || event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-cyan-300" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-cyan-300" />
                      <span>Expected Attendees: {event.expected_attendees ?? 'N/A'}</span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm line-clamp-4 mb-5">{event.description || 'Event description will be added soon.'}</p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <span className="text-xs text-slate-300 font-medium">{formatStatusLabel(event.status || event.sponsorship_status || 'Upcoming')}</span>
                    <button
                      onClick={() => navigate(`/sponsor/events/${event.event_id || event.id}`)}
                      className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
