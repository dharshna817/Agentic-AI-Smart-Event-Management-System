import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Building2, Sparkles, AlertTriangle, ArrowUpRight, CalendarClock, MapPinned } from 'lucide-react'

export default function VenueAgentPage() {
  const [venues, setVenues] = useState([])
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [venueRes, recRes] = await Promise.all([
          axios.get('/api/enterprise/venues'),
          axios.get('/api/enterprise/venues/recommend?attendees=180&date=2026-08-20'),
        ])
        setVenues(venueRes.data)
        setRecommendation(recRes.data)
      } catch (error) {
        console.error('Venue agent data failed', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-purple-300 text-xs uppercase tracking-[0.2em]">Rule-based Intelligence</p>
          <h1 className="font-orbitron text-3xl font-bold gradient-text">Venue Agent</h1>
        </div>

        {!loading && (
          <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">Recommended Venue</h3>
                <Sparkles className="text-purple-300" size={18} />
              </div>
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                <div className="text-white font-semibold text-xl">{recommendation?.best?.name || 'No venue selected'}</div>
                <div className="text-slate-400 text-sm mt-1">{recommendation?.best?.location}</div>
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
                  <Building2 size={14} /> Capacity {recommendation?.best?.capacity} • {recommendation?.utilizationSummary?.utilization || 0}% utilization
                </div>
                <div className="mt-4 text-slate-300 text-sm">{recommendation?.suggestion}</div>
              </div>

              <div className="mt-6 space-y-3">
                {venues.map((venue) => (
                  <div key={venue.id} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-medium">{venue.name}</div>
                        <div className="text-slate-400 text-xs">{venue.location}</div>
                      </div>
                      <span className="text-xs text-emerald-300">{venue.status}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Capacity {venue.capacity} • Equipment {venue.equipment?.length || 0}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Optimization Notes</h3>
                  <AlertTriangle className="text-amber-300" size={18} />
                </div>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex gap-2"><ArrowUpRight size={14} className="mt-1 text-purple-300" /> Match attendee count to room capacity with a preferred utilization band.</li>
                  <li className="flex gap-2"><ArrowUpRight size={14} className="mt-1 text-purple-300" /> Suggest upgrade for high-density sessions or downgrade for training workshops.</li>
                  <li className="flex gap-2"><ArrowUpRight size={14} className="mt-1 text-purple-300" /> Detect double booking before finalizing venue allocation.</li>
                </ul>
              </div>

              <div className="glass rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Alternatives</h3>
                  <CalendarClock className="text-cyan-300" size={18} />
                </div>
                <div className="space-y-3">
                  {(recommendation?.alternatives || []).map((alt) => (
                    <div key={alt.id} className="rounded-2xl border border-white/10 p-3 bg-white/5">
                      <div className="text-white font-medium">{alt.name}</div>
                      <div className="text-slate-400 text-xs">{alt.location}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
