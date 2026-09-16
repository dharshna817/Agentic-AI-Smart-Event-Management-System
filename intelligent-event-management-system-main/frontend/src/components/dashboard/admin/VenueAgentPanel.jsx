import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, Users, Zap, Plus, AlertTriangle, CheckCircle2,
  Edit2, Trash2, X, RefreshCw, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getVenues, createVenue, updateVenue, deleteVenue,
  getVenueBookings, recommendVenues
} from '../../../services/localDataService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const venueTypes = ['Auditorium', 'Conference Hall', 'Workshop Room', 'Expo Hall', 'Studio', 'Outdoor']
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function StatusBadge({ status }) {
  const map = {
    available: 'bg-emerald-900/30 text-emerald-300',
    maintenance: 'bg-yellow-900/30 text-yellow-300',
    unavailable: 'bg-red-900/30 text-red-300',
    inactive: 'bg-red-900/30 text-red-300',
  }
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${map[status] || 'bg-white/10 text-slate-300'}`}>
      {status}
    </span>
  )
}

function TagInput({ label, value, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const tags = Array.isArray(value) ? value : []

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) { onChange([...tags, trimmed]); setInput('') }
  }
  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag))

  return (
    <div>
      {label && <label className="text-xs text-slate-400 mb-1 block">{label}</label>}
      <div className="input-glass rounded-xl px-3 py-2 flex flex-wrap gap-2 min-h-[46px]">
        {tags.map((tag) => (
          <span key={tag} className="bg-purple-600/30 text-purple-200 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition"><X size={10} /></button>
          </span>
        ))}
        <input type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="bg-transparent outline-none text-white text-sm flex-1 min-w-[100px]" />
      </div>
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="glass rounded-3xl p-8 border border-red-500/30 max-w-md w-full mx-4">
        <h3 className="text-white font-semibold text-lg mb-3">Confirm Deletion</h3>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2 font-medium transition">Delete</button>
          <button onClick={onCancel} className="flex-1 btn-ghost rounded-xl px-4 py-2">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VenueAgentPanel() {
  const [venues, setVenues] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [agentQuery, setAgentQuery] = useState({
    expectedAttendance: '', requiredFacilities: [], requiredEquipment: [],
    sessionType: '', preferredVenueType: '',
  })
  const [agentResult, setAgentResult] = useState(null)
  const [formData, setFormData] = useState({
    name: '', location: '', capacity: '', venueType: 'Conference Hall',
    facilities: [], equipment: [], accessibility: [],
    setupTime: '15', cleanupTime: '15', status: 'available',
    availability: [{ day: 'Mon', start: '09:00', end: '17:00' }],
  })

  const load = useCallback(() => {
    try {
      setVenues(getVenues())
      setBookings(getVenueBookings())
    } catch { toast.error('Failed to load venues') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => {
    setFormData({ name: '', location: '', capacity: '', venueType: 'Conference Hall',
      facilities: [], equipment: [], accessibility: [],
      setupTime: '15', cleanupTime: '15', status: 'available',
      availability: [{ day: 'Mon', start: '09:00', end: '17:00' }] })
    setShowForm(false); setEditingId(null)
  }

  const handleSave = () => {
    if (!formData.name.trim()) return toast.error('Venue name is required')
    if (!formData.capacity || Number(formData.capacity) <= 0) return toast.error('Valid capacity is required')
    if (!editingId) {
      const dup = getVenues().find((v) => v.name.trim().toLowerCase() === formData.name.trim().toLowerCase())
      if (dup) return toast.error('A venue with this name already exists')
    }
    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        setupTime: Number(formData.setupTime || 0),
        cleanupTime: Number(formData.cleanupTime || 0),
      }
      if (editingId) { updateVenue(editingId, payload); toast.success('Venue updated') }
      else { createVenue(payload); toast.success('Venue added') }
      resetForm(); load()
    } catch (err) { toast.error(err.message || 'Failed to save venue') }
  }

  const handleEdit = (venue) => {
    setEditingId(venue.venue_id)
    setFormData({
      name: venue.name, location: venue.location || '',
      capacity: String(venue.capacity || ''), venueType: venue.venueType || 'Conference Hall',
      facilities: venue.facilities || [], equipment: venue.equipment || [],
      accessibility: venue.accessibility || [],
      setupTime: String(venue.setupTime || 15), cleanupTime: String(venue.cleanupTime || 15),
      status: venue.status || 'available',
      availability: venue.availability || [{ day: 'Mon', start: '09:00', end: '17:00' }],
    })
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    deleteVenue(id); toast.success('Venue deleted'); setConfirmDelete(null); load()
  }

  const toggleStatus = (venue) => {
    const next = venue.status === 'available' ? 'unavailable' : 'available'
    updateVenue(venue.venue_id, { status: next })
    toast.success(`Venue ${next === 'available' ? 'activated' : 'deactivated'}`); load()
  }

  const handleRunAgent = () => {
    if (!agentQuery.expectedAttendance) return toast.error('Expected attendance is required to run the Venue Agent')
    const result = recommendVenues({
      expectedAttendance: Number(agentQuery.expectedAttendance),
      requiredFacilities: agentQuery.requiredFacilities,
      requiredEquipment: agentQuery.requiredEquipment,
      sessionType: agentQuery.sessionType,
      preferredVenueType: agentQuery.preferredVenueType,
    })
    setAgentResult(result)
    toast.success('Venue Agent analysis complete')
  }

  const venueBookings = (venueId) => bookings.filter((b) => b.venue_id === venueId && b.status !== 'cancelled')

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
            onConfirm={() => handleDelete(confirmDelete.venue_id)} onCancel={() => setConfirmDelete(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Venue Agent</h1>
          <p className="text-slate-400">Intelligent venue management and optimization</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary rounded-xl px-5 py-3 flex items-center gap-2">
          <Plus size={18} /> Add Venue
        </button>
      </div>

      {/* Venue Agent Query */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-purple-400" size={20} />
          <h2 className="text-white font-semibold">Venue Agent — Find Best Match</h2>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Expected Attendance *</label>
            <input type="number" className="input-glass rounded-xl px-4 py-3 w-full" placeholder="e.g. 200"
              value={agentQuery.expectedAttendance}
              onChange={(e) => setAgentQuery({ ...agentQuery, expectedAttendance: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Session Type</label>
            <select className="input-glass rounded-xl px-4 py-3 w-full" value={agentQuery.sessionType}
              onChange={(e) => setAgentQuery({ ...agentQuery, sessionType: e.target.value })}>
              <option value="">Any</option>
              {['Keynote','Workshop','Talk','Panel','Demo'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Preferred Venue Type</label>
            <select className="input-glass rounded-xl px-4 py-3 w-full" value={agentQuery.preferredVenueType}
              onChange={(e) => setAgentQuery({ ...agentQuery, preferredVenueType: e.target.value })}>
              <option value="">Any</option>
              {venueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <TagInput label="Required Facilities" value={agentQuery.requiredFacilities}
              onChange={(v) => setAgentQuery({ ...agentQuery, requiredFacilities: v })} placeholder="e.g. Wi-Fi, Stage" />
          </div>
          <div>
            <TagInput label="Required Equipment" value={agentQuery.requiredEquipment}
              onChange={(v) => setAgentQuery({ ...agentQuery, requiredEquipment: v })} placeholder="e.g. Microphones" />
          </div>
        </div>
        <button onClick={handleRunAgent} className="btn-primary rounded-xl px-6 py-2 flex items-center gap-2">
          <Zap size={16} /> Find Venues
        </button>

        {/* Agent Results */}
        {agentResult && (
          <div className="mt-5 space-y-4">
            {agentResult.recommended ? (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-purple-400" size={16} />
                  <span className="text-purple-300 font-semibold">Best Match: {agentResult.recommended.name}</span>
                  <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full">
                    Score: {agentResult.recommended.matchScore}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${agentResult.recommended.capacityOk ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
                    Cap: {agentResult.recommended.capacity}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{agentResult.recommended.location} · {agentResult.recommended.venueType}</p>
                <p className="text-slate-400 text-sm">Utilization: {agentResult.recommended.utilization}%</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {agentResult.recommended.reasons?.map((r, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded ${r.includes('Well matched') ? 'bg-emerald-900/20 text-emerald-400' : 'bg-amber-900/20 text-amber-300'}`}>{r}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertTriangle size={16} /> No suitable venue found matching all criteria
                </div>
              </div>
            )}
            {agentResult.alternatives?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs mb-2">Alternatives:</p>
                <div className="grid md:grid-cols-3 gap-3">
                  {agentResult.alternatives.map((v) => (
                    <div key={v.venue_id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-white text-sm font-medium">{v.name}</p>
                      <p className="text-slate-400 text-xs mt-1">Score: {v.matchScore} · Cap: {v.capacity}</p>
                      <p className="text-slate-500 text-xs">{v.venueType} · {v.utilization}% util</p>
                      {!v.capacityOk && <p className="text-red-400 text-xs mt-1">⚠ Insufficient capacity</p>}
                      {!v.available && <p className="text-orange-400 text-xs mt-1">⚠ Unavailable</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="glass rounded-3xl p-6 border border-purple-500/30">
            <h2 className="text-white font-semibold mb-4">{editingId ? 'Edit Venue' : 'Add New Venue'}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input-glass rounded-xl px-4 py-3" placeholder="Venue name *"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input className="input-glass rounded-xl px-4 py-3" placeholder="Location"
                value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              <input type="number" className="input-glass rounded-xl px-4 py-3" placeholder="Capacity *"
                value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Venue Type</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.venueType}
                  onChange={(e) => setFormData({ ...formData, venueType: e.target.value })}>
                  {venueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Setup Time (min)</label>
                <input type="number" className="input-glass rounded-xl px-4 py-3 w-full" placeholder="15"
                  value={formData.setupTime} onChange={(e) => setFormData({ ...formData, setupTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Cleanup Time (min)</label>
                <input type="number" className="input-glass rounded-xl px-4 py-3 w-full" placeholder="15"
                  value={formData.cleanupTime} onChange={(e) => setFormData({ ...formData, cleanupTime: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Status</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              {/* Availability */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Avail. Day</label>
                  <select className="input-glass rounded-xl px-3 py-3 w-full" value={formData.availability[0]?.day || 'Mon'}
                    onChange={(e) => setFormData({ ...formData, availability: [{ ...formData.availability[0], day: e.target.value }] })}>
                    {weekDays.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">From</label>
                  <input type="time" className="input-glass rounded-xl px-3 py-3 w-full"
                    value={formData.availability[0]?.start || '09:00'}
                    onChange={(e) => setFormData({ ...formData, availability: [{ ...formData.availability[0], start: e.target.value }] })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">To</label>
                  <input type="time" className="input-glass rounded-xl px-3 py-3 w-full"
                    value={formData.availability[0]?.end || '17:00'}
                    onChange={(e) => setFormData({ ...formData, availability: [{ ...formData.availability[0], end: e.target.value }] })} />
                </div>
              </div>
              <div className="md:col-span-2">
                <TagInput label="Facilities" value={formData.facilities}
                  onChange={(v) => setFormData({ ...formData, facilities: v })} placeholder="e.g. Wi-Fi, Stage, Projector" />
              </div>
              <div className="md:col-span-2">
                <TagInput label="Equipment" value={formData.equipment}
                  onChange={(v) => setFormData({ ...formData, equipment: v })} placeholder="e.g. Microphones, LED Screen" />
              </div>
              <div className="md:col-span-2">
                <TagInput label="Accessibility" value={formData.accessibility}
                  onChange={(v) => setFormData({ ...formData, accessibility: v })} placeholder="e.g. Wheelchair Access, Lift" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="btn-primary rounded-xl px-6 py-2">{editingId ? 'Update' : 'Save'}</button>
              <button onClick={resetForm} className="btn-ghost rounded-xl px-6 py-2">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Venues Grid */}
      {loading && <div className="text-center text-slate-400">Loading venues...</div>}

      {!loading && venues.length === 0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center text-slate-400">No venues found.</div>
      )}

      {!loading && venues.length > 0 && (
        <div className="grid md:grid-cols-2 gap-5">
          {venues.map((venue) => {
            const vb = venueBookings(venue.venue_id)
            const utilizationHours = vb.reduce((sum, b) => {
              const diff = new Date(b.end_time) - new Date(b.start_time)
              return sum + diff / (1000 * 60 * 60)
            }, 0)
            return (
              <motion.div key={venue.venue_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl p-6 border border-white/10 hover:border-purple-500/20 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                      <Building2 className="text-purple-400" size={22} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{venue.name}</h3>
                      <p className="text-slate-400 text-sm flex items-center gap-1"><MapPin size={12} /> {venue.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={venue.status} />
                    <button onClick={() => handleEdit(venue)} className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-purple-300"><Edit2 size={14} /></button>
                    <button onClick={() => setConfirmDelete(venue)} className="p-1.5 hover:bg-red-900/20 rounded-lg transition text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users size={14} className="text-cyan-400" />
                    Capacity: <span className="text-white font-semibold">{venue.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} className="text-purple-400" />
                    Setup: <span className="text-white">{venue.setupTime}m</span> / <span className="text-white">{venue.cleanupTime}m</span>
                  </div>
                  <div className="text-slate-400">
                    Type: <span className="text-cyan-300">{venue.venueType}</span>
                  </div>
                  <div className="text-slate-400">
                    Bookings: <span className="text-white">{vb.length}</span> ({utilizationHours.toFixed(1)}h)
                  </div>
                </div>

                {venue.facilities?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Facilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {venue.facilities.map((f, i) => (
                        <span key={i} className="bg-white/10 text-slate-300 text-xs px-2 py-0.5 rounded-lg">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {venue.equipment?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Equipment:</p>
                    <div className="flex flex-wrap gap-1">
                      {venue.equipment.map((e, i) => (
                        <span key={i} className="bg-cyan-900/20 text-cyan-300 text-xs px-2 py-0.5 rounded-lg">{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                  <span className="text-xs text-slate-500">
                    Avail: {venue.availability?.[0]?.day} {venue.availability?.[0]?.start}–{venue.availability?.[0]?.end}
                  </span>
                  <button onClick={() => toggleStatus(venue)}
                    className={`px-3 py-1 rounded-lg border text-xs transition ${venue.status === 'available'
                      ? 'border-red-900/30 text-red-400 hover:bg-red-900/20' : 'border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/20'}`}>
                    {venue.status === 'available' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Upcoming Bookings */}
      {!loading && bookings.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 border border-white/10">
          <h2 className="text-white font-semibold mb-4">Venue Bookings</h2>
          <div className="space-y-2">
            {bookings.slice(0, 10).map((booking) => {
              const venue = venues.find((v) => Number(v.venue_id) === Number(booking.venue_id))
              const hasConflict = bookings.filter((b) =>
                Number(b.venue_id) === Number(booking.venue_id) &&
                b.status !== 'cancelled' &&
                Number(b.booking_id) !== Number(booking.booking_id) &&
                new Date(b.start_time) < new Date(booking.end_time) &&
                new Date(b.end_time) > new Date(booking.start_time)
              ).length > 0
              return (
                <div key={booking.booking_id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                  <div>
                    <p className="text-white font-medium text-sm">{venue?.name || `Venue #${booking.venue_id}`}</p>
                    <p className="text-slate-400 text-xs">{new Date(booking.start_time).toLocaleString()} → {new Date(booking.end_time).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasConflict && (
                      <span className="flex items-center gap-1 text-orange-400 text-xs">
                        <AlertTriangle size={12} /> Conflict
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-lg ${booking.status === 'confirmed' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
