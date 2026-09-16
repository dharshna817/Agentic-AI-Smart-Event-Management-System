import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Zap, AlertCircle, CheckCircle2, Trash2, Edit2, X,
  Plus, Calendar, Clock, MapPin, Mic2, BarChart3, Bell,
  RefreshCw, Eye, EyeOff, Star, Handshake, ShieldCheck,
  FileText, BadgeCheck, CircleDollarSign, Sparkles, AlertTriangle as TriangleAlert,
  TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getEvents, createEvent, updateEvent, deleteEvent,
  getSpeakers, createSpeaker, updateSpeaker, deleteSpeaker,
  getSessions, createSession, updateSession, deleteSession,
  getVenues, getAttendance, recordAttendance,
  getFeedback, getNotifications, notifyUsers,
  detectConflicts, optimizeVenue, recommendSpeakers,
  getAnalytics, getSpeakerAssignments,
  getIncidents, updateIncident, deleteIncident,
  getTechnicians, createTechnician, updateTechnician,
  recommendTechnician, analyzeIncident
} from "../../../services/localDataService";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const eventStatuses = ["DRAFT", "PUBLISHED", "ACTIVE", "COMPLETED", "CANCELLED"];
const sessionTypes = ["Keynote", "Workshop", "Talk", "Panel", "Demo", "Networking"];
const venueTypes = ["Auditorium", "Conference Hall", "Workshop Room", "Expo Hall", "Studio", "Outdoor"];

function StatusBadge({ status }) {
  const map = {
    PUBLISHED: "bg-emerald-900/30 text-emerald-300",
    ACTIVE: "bg-cyan-900/30 text-cyan-300",
    DRAFT: "bg-slate-700/50 text-slate-300",
    COMPLETED: "bg-blue-900/30 text-blue-300",
    CANCELLED: "bg-red-900/30 text-red-300",
    scheduled: "bg-purple-900/30 text-purple-300",
    active: "bg-emerald-900/30 text-emerald-300",
    inactive: "bg-red-900/30 text-red-300",
    available: "bg-emerald-900/30 text-emerald-300",
    maintenance: "bg-yellow-900/30 text-yellow-300",
    unavailable: "bg-red-900/30 text-red-300",
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${map[status] || "bg-white/10 text-slate-300"}`}>
      {status}
    </span>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-3xl p-8 border border-red-500/30 max-w-md w-full mx-4"
      >
        <h3 className="text-white font-semibold text-lg mb-3">Confirm Action</h3>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2 font-medium transition">
            Delete
          </button>
          <button onClick={onCancel} className="flex-1 btn-ghost rounded-xl px-4 py-2">
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TagInput({ label, value, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const tags = Array.isArray(value) ? value : [];

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="bg-transparent outline-none text-white text-sm flex-1 min-w-[100px]"
        />
      </div>
    </div>
  );
}

// ─── EVENTS PANEL ─────────────────────────────────────────────────────────────

export function EventsPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "", description: "", location: "", startDate: "", endDate: "", status: "DRAFT",
  });

  const load = useCallback(() => {
    try { setEvents(getEvents()); } catch { toast.error("Failed to load events"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormData({ name: "", description: "", location: "", startDate: "", endDate: "", status: "DRAFT" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return toast.error("Event name is required");
    if (!formData.startDate) return toast.error("Start date is required");
    if (!formData.endDate) return toast.error("End date is required");
    if (new Date(formData.startDate) >= new Date(formData.endDate)) return toast.error("End date must be after start date");

    const existing = getEvents();
    if (!editingId) {
      const dup = existing.find(
        (e) => e.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
          e.start_date?.slice(0, 10) === formData.startDate?.slice(0, 10)
      );
      if (dup) return toast.error("An event with this name and start date already exists");
    }

    try {
      if (editingId) {
        updateEvent(editingId, formData);
        toast.success("Event updated");
      } else {
        createEvent(formData);
        toast.success("Event created");
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || "Failed to save event");
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.event_id);
    setFormData({
      name: event.name,
      description: event.description || "",
      location: event.location || "",
      startDate: event.start_date?.slice(0, 16) || "",
      endDate: event.end_date?.slice(0, 16) || "",
      status: event.status,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    deleteEvent(id);
    toast.success("Event deleted");
    setConfirmDelete(null);
    load();
  };

  const toggleStatus = (event) => {
    const next = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    updateEvent(event.event_id, { status: next });
    toast.success(`Event ${next === "PUBLISHED" ? "published" : "unpublished"}`);
    load();
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog
            message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
            onConfirm={() => handleDelete(confirmDelete.event_id)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Events</h1>
          <p className="text-slate-400">Create, publish, and manage event lifecycle</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary rounded-xl px-5 py-3 flex items-center gap-2">
          <Plus size={18} /> New Event
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="glass rounded-3xl p-6 border border-purple-500/30">
            <h2 className="text-white font-semibold mb-4">{editingId ? "Edit Event" : "New Event"}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input-glass rounded-xl px-4 py-3 md:col-span-2" placeholder="Event name *"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input className="input-glass rounded-xl px-4 py-3" placeholder="Location"
                value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              <select className="input-glass rounded-xl px-4 py-3" value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                {eventStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start Date & Time *</label>
                <input type="datetime-local" className="input-glass rounded-xl px-4 py-3 w-full"
                  value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">End Date & Time *</label>
                <input type="datetime-local" className="input-glass rounded-xl px-4 py-3 w-full"
                  value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
              <textarea rows="3" className="input-glass rounded-xl px-4 py-3 md:col-span-2" placeholder="Description"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="btn-primary rounded-xl px-6 py-2">{editingId ? "Update" : "Save"}</button>
              <button onClick={resetForm} className="btn-ghost rounded-xl px-6 py-2">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <div className="text-slate-400">Loading events...</div>}

      {!loading && events.length === 0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center text-slate-400">No events found.</div>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <motion.div key={event.event_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-2xl p-5 border border-white/10 hover:border-purple-500/20 transition">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-lg">{event.name}</p>
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(event.start_date).toLocaleString()} → {new Date(event.end_date).toLocaleString()}
                  </p>
                  {event.location && (
                    <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                      <MapPin size={12} /> {event.location}
                    </p>
                  )}
                  {event.description && <p className="text-slate-500 text-xs mt-2 line-clamp-1">{event.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <StatusBadge status={event.status} />
                  <button onClick={() => toggleStatus(event)}
                    className="text-xs px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition flex items-center gap-1">
                    {event.status === "PUBLISHED" ? <><EyeOff size={12} /> Unpublish</> : <><Eye size={12} /> Publish</>}
                  </button>
                  <button onClick={() => handleEdit(event)}
                    className="text-xs px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-purple-300 hover:border-purple-500/30 transition">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => setConfirmDelete(event)}
                    className="text-xs px-3 py-1 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-900/20 transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SPEAKER AGENT PANEL ──────────────────────────────────────────────────────

export function SpeakerAgentPanel() {
  const [speakers, setSpeakers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [recQuery, setRecQuery] = useState({ expertise: [], sessionType: "", topic: "" });
  const [recommendations, setRecommendations] = useState(null);
  const [formData, setFormData] = useState({
    name: "", email: "", bio: "", expertise: [], languages: [],
    preferredSessionTypes: [], preferredTopics: [],
    availability: [{ day: "Mon", start: "09:00", end: "17:00" }], status: "active",
  });

  const load = useCallback(() => {
    try {
      setSpeakers(getSpeakers());
      setSessions(getSessions());
    } catch { toast.error("Failed to load speakers"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormData({
      name: "", email: "", bio: "", expertise: [], languages: [],
      preferredSessionTypes: [], preferredTopics: [],
      availability: [{ day: "Mon", start: "09:00", end: "17:00" }], status: "active"
    });
    setShowForm(false); setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return toast.error("Speaker name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!editingId) {
      const dup = getSpeakers().find((s) => s.email.toLowerCase() === formData.email.toLowerCase());
      if (dup) return toast.error("A speaker with this email already exists");
    }
    try {
      if (editingId) { updateSpeaker(editingId, formData); toast.success("Speaker updated"); }
      else { createSpeaker(formData); toast.success("Speaker added"); }
      resetForm(); load();
    } catch (err) { toast.error(err.message || "Failed to save speaker"); }
  };

  const handleEdit = (speaker) => {
    setEditingId(speaker.speaker_id);
    setFormData({
      name: speaker.name, email: speaker.email, bio: speaker.bio || "",
      expertise: speaker.expertise || [], languages: speaker.languages || [],
      preferredSessionTypes: speaker.preferredSessionTypes || [],
      preferredTopics: speaker.preferredTopics || [],
      availability: speaker.availability || [{ day: "Mon", start: "09:00", end: "17:00" }],
      status: speaker.status || "active",
    });
    setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    deleteSpeaker(id); toast.success("Speaker deleted"); setConfirmDelete(null); load();
  };

  const toggleStatus = (speaker) => {
    const next = speaker.status === "active" ? "inactive" : "active";
    updateSpeaker(speaker.speaker_id, { status: next });
    toast.success(`Speaker ${next === "active" ? "activated" : "deactivated"}`); load();
  };

  const handleRunAgent = () => {
    if (!recQuery.expertise.length && !recQuery.topic && !recQuery.sessionType)
      return toast.error("Enter at least one search criterion");
    const result = recommendSpeakers({ expertise: recQuery.expertise, topic: recQuery.topic, sessionType: recQuery.sessionType });
    setRecommendations(result);
    toast.success("Speaker Agent completed analysis");
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
            onConfirm={() => handleDelete(confirmDelete.speaker_id)} onCancel={() => setConfirmDelete(null)} />
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Speakers</h1>
          <p className="text-slate-400">Manage speakers and run AI recommendations</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary rounded-xl px-5 py-3 flex items-center gap-2">
          <Plus size={18} /> Add Speaker
        </button>
      </div>

      {/* Speaker Agent */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-cyan-400" size={20} />
          <h2 className="text-white font-semibold">Speaker Agent</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Expertise Areas</label>
            <TagInput value={recQuery.expertise} onChange={(v) => setRecQuery({ ...recQuery, expertise: v })}
              placeholder="e.g. AI, Cloud" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Topic</label>
            <input className="input-glass rounded-xl px-4 py-3 w-full" placeholder="e.g. Responsible AI"
              value={recQuery.topic} onChange={(e) => setRecQuery({ ...recQuery, topic: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Session Type</label>
            <select className="input-glass rounded-xl px-4 py-3 w-full" value={recQuery.sessionType}
              onChange={(e) => setRecQuery({ ...recQuery, sessionType: e.target.value })}>
              <option value="">Any</option>
              {sessionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleRunAgent} className="btn-primary rounded-xl px-6 py-2 flex items-center gap-2">
          <Zap size={16} /> Find Speakers
        </button>

        {recommendations && (
          <div className="mt-4 space-y-3">
            {recommendations.recommended && (
              <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="text-cyan-400" size={16} />
                  <span className="text-cyan-300 font-semibold">Best Match: {recommendations.recommended.name}</span>
                  <span className="text-xs bg-cyan-600/30 text-cyan-300 px-2 py-0.5 rounded-full">
                    Score: {recommendations.recommended.matchScore}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{recommendations.recommended.email}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {recommendations.recommended.reasons?.map((r, i) => (
                    <span key={i} className="text-xs bg-white/5 text-slate-300 px-2 py-0.5 rounded">{r}</span>
                  ))}
                </div>
              </div>
            )}
            {recommendations.alternatives?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs mb-2">Alternatives:</p>
                <div className="grid md:grid-cols-3 gap-2">
                  {recommendations.alternatives.map((s) => (
                    <div key={s.speaker_id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-white text-sm font-medium">{s.name}</p>
                      <p className="text-slate-400 text-xs mt-1">Score: {s.matchScore}</p>
                      <p className="text-slate-500 text-xs">{(s.expertise || []).slice(0, 2).join(", ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="glass rounded-3xl p-6 border border-purple-500/30">
            <h2 className="text-white font-semibold mb-4">{editingId ? "Edit Speaker" : "Add New Speaker"}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input-glass rounded-xl px-4 py-3" placeholder="Full name *"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input type="email" className="input-glass rounded-xl px-4 py-3" placeholder="Email *"
                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <div className="md:col-span-2">
                <TagInput label="Expertise (press Enter to add)" value={formData.expertise}
                  onChange={(v) => setFormData({ ...formData, expertise: v })} placeholder="e.g. AI, Cloud, Analytics" />
              </div>
              <TagInput label="Languages" value={formData.languages}
                onChange={(v) => setFormData({ ...formData, languages: v })} placeholder="e.g. English, Hindi" />
              <TagInput label="Preferred Session Types" value={formData.preferredSessionTypes}
                onChange={(v) => setFormData({ ...formData, preferredSessionTypes: v })} placeholder="e.g. Keynote, Workshop" />
              <div className="md:col-span-2">
                <TagInput label="Preferred Topics" value={formData.preferredTopics}
                  onChange={(v) => setFormData({ ...formData, preferredTopics: v })} placeholder="e.g. Responsible AI" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Availability – Day</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full"
                  value={formData.availability[0]?.day || "Mon"}
                  onChange={(e) => setFormData({ ...formData, availability: [{ ...formData.availability[0], day: e.target.value }] })}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Start</label>
                  <input type="time" className="input-glass rounded-xl px-4 py-3 w-full"
                    value={formData.availability[0]?.start || "09:00"}
                    onChange={(e) => setFormData({ ...formData, availability: [{ ...formData.availability[0], start: e.target.value }] })} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">End</label>
                  <input type="time" className="input-glass rounded-xl px-4 py-3 w-full"
                    value={formData.availability[0]?.end || "17:00"}
                    onChange={(e) => setFormData({ ...formData, availability: [{ ...formData.availability[0], end: e.target.value }] })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Status</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <textarea rows="3" className="input-glass rounded-xl px-4 py-3 md:col-span-2" placeholder="Bio"
                value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="btn-primary rounded-xl px-6 py-2">{editingId ? "Update" : "Save"}</button>
              <button onClick={resetForm} className="btn-ghost rounded-xl px-6 py-2">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <div className="text-slate-400">Loading speakers...</div>}

      {!loading && (
        <div className="grid md:grid-cols-2 gap-4">
          {speakers.map((speaker) => {
            const assigned = sessions.filter((s) => Number(s.speaker_id) === Number(speaker.speaker_id));
            return (
              <motion.div key={speaker.speaker_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl p-6 border border-white/10 hover:border-cyan-500/20 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{speaker.name}</h3>
                    <p className="text-slate-400 text-sm">{speaker.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={speaker.status} />
                    <button onClick={() => handleEdit(speaker)} className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-purple-300"><Edit2 size={14} /></button>
                    <button onClick={() => setConfirmDelete(speaker)} className="p-1.5 hover:bg-red-900/20 rounded-lg transition text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>

                {speaker.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {speaker.expertise.map((e, i) => (
                      <span key={i} className="bg-cyan-600/20 text-cyan-300 text-xs px-2 py-0.5 rounded-lg">{e}</span>
                    ))}
                  </div>
                )}

                {speaker.bio && (
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2">{speaker.bio}</p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/10 pt-3">
                  <span>{assigned.length} session{assigned.length !== 1 ? "s" : ""} assigned</span>
                  <button onClick={() => toggleStatus(speaker)}
                    className={`px-3 py-1 rounded-lg border transition ${speaker.status === "active" ? "border-red-900/30 text-red-400 hover:bg-red-900/20" : "border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/20"}`}>
                    {speaker.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && speakers.length === 0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center text-slate-400">No speakers found.</div>
      )}
    </div>
  );
}

// ─── SESSIONS PANEL ───────────────────────────────────────────────────────────

export function SessionsPanel() {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    event_id: "", title: "", description: "", sessionType: "Talk",
    expectedAttendance: "", requiredFacilities: [], requiredEquipment: [],
    preferredVenueType: "Conference Hall", start_time: "", end_time: "",
    venue_id: "", speaker_id: "", status: "scheduled",
  });

  const load = useCallback(() => {
    try {
      setSessions(getSessions());
      setEvents(getEvents());
      setVenues(getVenues());
      setSpeakers(getSpeakers());
    } catch { toast.error("Failed to load sessions"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormData({
      event_id: "", title: "", description: "", sessionType: "Talk",
      expectedAttendance: "", requiredFacilities: [], requiredEquipment: [],
      preferredVenueType: "Conference Hall", start_time: "", end_time: "",
      venue_id: "", speaker_id: "", status: "scheduled"
    });
    setShowForm(false); setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return toast.error("Session title is required");
    if (!formData.start_time) return toast.error("Start time is required");
    if (!formData.end_time) return toast.error("End time is required");
    if (new Date(formData.start_time) >= new Date(formData.end_time)) return toast.error("End time must be after start time");
    if (!formData.event_id) return toast.error("Please select an event");

    try {
      const payload = {
        ...formData,
        event_id: Number(formData.event_id),
        venue_id: formData.venue_id ? Number(formData.venue_id) : null,
        speaker_id: formData.speaker_id ? Number(formData.speaker_id) : null,
        expectedAttendance: Number(formData.expectedAttendance || 0),
      };
      if (editingId) { updateSession(editingId, payload); toast.success("Session updated"); }
      else { createSession(payload); toast.success("Session created"); }
      resetForm(); load();
    } catch (err) {
      toast.error(err.message || "Failed to save session");
    }
  };

  const handleEdit = (session) => {
    setEditingId(session.session_id);
    setFormData({
      event_id: String(session.event_id || ""),
      title: session.title || session.session_name || "",
      description: session.description || "",
      sessionType: session.sessionType || "Talk",
      expectedAttendance: String(session.expectedAttendance || ""),
      requiredFacilities: session.requiredFacilities || [],
      requiredEquipment: session.requiredEquipment || [],
      preferredVenueType: session.preferredVenueType || "Conference Hall",
      start_time: session.start_time?.slice(0, 16) || "",
      end_time: session.end_time?.slice(0, 16) || "",
      venue_id: session.venue_id ? String(session.venue_id) : "",
      speaker_id: session.speaker_id ? String(session.speaker_id) : "",
      status: session.status || "scheduled",
    });
    setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    deleteSession(id); toast.success("Session deleted"); setConfirmDelete(null); load();
  };

  const getName = (arr, idKey, id, nameKey) => arr.find((x) => Number(x[idKey]) === Number(id))?.[nameKey] || "—";

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog message={`Delete "${confirmDelete.title || confirmDelete.session_name}"? This cannot be undone.`}
            onConfirm={() => handleDelete(confirmDelete.session_id)} onCancel={() => setConfirmDelete(null)} />
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Sessions</h1>
          <p className="text-slate-400">Schedule, reschedule, and manage sessions</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary rounded-xl px-5 py-3 flex items-center gap-2">
          <Plus size={18} /> Add Session
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="glass rounded-3xl p-6 border border-purple-500/30">
            <h2 className="text-white font-semibold mb-4">{editingId ? "Edit Session" : "New Session"}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Event *</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.event_id}
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}>
                  <option value="">Select event…</option>
                  {events.map((ev) => <option key={ev.event_id} value={ev.event_id}>{ev.name}</option>)}
                </select>
              </div>
              <input className="input-glass rounded-xl px-4 py-3" placeholder="Session title *"
                value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Session Type</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.sessionType}
                  onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}>
                  {sessionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <input type="number" className="input-glass rounded-xl px-4 py-3" placeholder="Expected attendance"
                value={formData.expectedAttendance} onChange={(e) => setFormData({ ...formData, expectedAttendance: e.target.value })} />
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start Time *</label>
                <input type="datetime-local" className="input-glass rounded-xl px-4 py-3 w-full"
                  value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">End Time *</label>
                <input type="datetime-local" className="input-glass rounded-xl px-4 py-3 w-full"
                  value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Venue</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.venue_id}
                  onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}>
                  <option value="">No venue</option>
                  {venues.map((v) => <option key={v.venue_id} value={v.venue_id}>{v.name} (cap: {v.capacity})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Speaker</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.speaker_id}
                  onChange={(e) => setFormData({ ...formData, speaker_id: e.target.value })}>
                  <option value="">No speaker</option>
                  {speakers.map((s) => <option key={s.speaker_id} value={s.speaker_id}>{s.name} ({s.status})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Preferred Venue Type</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.preferredVenueType}
                  onChange={(e) => setFormData({ ...formData, preferredVenueType: e.target.value })}>
                  {venueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Status</label>
                <select className="input-glass rounded-xl px-4 py-3 w-full" value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  {["scheduled", "cancelled", "completed"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <TagInput label="Required Facilities" value={formData.requiredFacilities}
                  onChange={(v) => setFormData({ ...formData, requiredFacilities: v })} placeholder="e.g. Wi-Fi, Stage" />
              </div>
              <div className="md:col-span-2">
                <TagInput label="Required Equipment" value={formData.requiredEquipment}
                  onChange={(v) => setFormData({ ...formData, requiredEquipment: v })} placeholder="e.g. Microphones" />
              </div>
              <textarea rows="3" className="input-glass rounded-xl px-4 py-3 md:col-span-2" placeholder="Description"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="btn-primary rounded-xl px-6 py-2">{editingId ? "Update" : "Create"}</button>
              <button onClick={resetForm} className="btn-ghost rounded-xl px-6 py-2">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <div className="text-slate-400">Loading sessions...</div>}

      {!loading && sessions.length === 0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center text-slate-400">No sessions found.</div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => (
            <motion.div key={session.session_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-2xl p-5 border border-white/10 hover:border-purple-500/20 transition">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{session.title || session.session_name}</p>
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(session.start_time).toLocaleString()} → {new Date(session.end_time).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {getName(venues, "venue_id", session.venue_id, "name")}</span>
                    <span className="flex items-center gap-1"><Mic2 size={11} /> {getName(speakers, "speaker_id", session.speaker_id, "name")}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {session.expectedAttendance} expected</span>
                    <span className="capitalize">{session.sessionType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={session.status} />
                  <button onClick={() => handleEdit(session)} className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-purple-300"><Edit2 size={14} /></button>
                  <button onClick={() => setConfirmDelete(session)} className="p-1.5 hover:bg-red-900/20 rounded-lg transition text-slate-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SCHEDULE PANEL ───────────────────────────────────────────────────────────

export function SponsorshipManagementPanel() {
  const [stats, setStats] = useState({ totalSponsors: 0, pendingProposals: 0, approvedSponsorships: 0, totalSponsorshipValue: '₹0' });
  const [proposals, setProposals] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [performanceOverview, setPerformanceOverview] = useState({ overview: { totalSponsors: 0, avgEngagementScore: 0, strongSponsors: 0 }, records: [] });
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedSponsorReport, setSelectedSponsorReport] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [filters, setFilters] = useState({ status: 'All', package: 'All', event: 'All', search: '' });
  const [decision, setDecision] = useState({ type: '', reason: '', amount: '', message: '' });

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('eventai_user') || '{}');
    } catch {
      return {};
    }
  })();

  const load = useCallback(async () => {
    try {
      const [overviewRes, proposalsRes, sponsorsRes, performanceRes] = await Promise.all([
        axios.get('/api/admin/sponsorships/overview', { headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@eventai.local' } }),
        axios.get('/api/admin/sponsorships/proposals', { headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@eventai.local' } }),
        axios.get('/api/admin/sponsorships/sponsors', { headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@eventai.local' } }),
        axios.get('/api/admin/sponsorships/performance', { headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@eventai.local' } }),
      ]);
      setStats(overviewRes.data || { totalSponsors: 0, pendingProposals: 0, approvedSponsorships: 0, totalSponsorshipValue: '₹0' });
      setProposals(proposalsRes.data || []);
      setSponsors(sponsorsRes.data || []);
      setPerformanceOverview(performanceRes.data || { overview: { totalSponsors: 0, avgEngagementScore: 0, strongSponsors: 0 }, records: [] });
    } catch (error) {
      console.error('Failed to load sponsorship management data', error);
      setProposals([]);
      setSponsors([]);
      toast.error('Unable to load sponsorship management data');
    } finally {
      setLoading(false);
    }
  }, [user.email]);

  useEffect(() => { load(); }, [load]);

  const filteredProposals = proposals.filter((proposal) => {
    const statusMatch = filters.status === 'All' || String(proposal.status || '').toLowerCase() === String(filters.status).toLowerCase();
    const packageMatch = filters.package === 'All' || String(proposal.package_name || '').toLowerCase() === String(filters.package).toLowerCase();
    const eventMatch = filters.event === 'All' || String(proposal.event?.name || '').toLowerCase() === String(filters.event).toLowerCase();
    const search = filters.search.trim().toLowerCase();
    const searchMatch = !search || [
      proposal.proposal_id,
      proposal.sponsor?.company_name,
      proposal.sponsor?.contact_person,
      proposal.event?.name,
      proposal.package_name,
    ].join(' ').toLowerCase().includes(search);

    return statusMatch && packageMatch && eventMatch && searchMatch;
  });

  const eventOptions = Array.from(new Set(proposals.map((proposal) => proposal.event?.name).filter(Boolean)));

  const openReview = async (proposalId) => {
    try {
      const response = await axios.get(`/api/admin/sponsorships/proposals/${proposalId}`, {
        headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@eventai.local' },
      });
      setSelectedProposal(response.data);
      setDecision({ type: '', reason: '', amount: '', message: '' });
      setReviewOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load proposal review');
    }
  };

  const applyDecision = async (type) => {
    if (!selectedProposal) return;

    if (type === 'reject' && !String(decision.reason || '').trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    if (type === 'negotiate' && !String(decision.message || '').trim()) {
      toast.error('Negotiation message is required.');
      return;
    }

    try {
      const payload = {
        reason: decision.reason,
        message: decision.message,
        negotiated_amount: Number(decision.amount || 0),
      };

      await axios.put(`/api/admin/sponsorships/proposals/${selectedProposal.proposal_id}/${type}`, payload, {
        headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@eventai.local' },
      });

      toast.success(type === 'approve' ? 'Proposal approved' : type === 'negotiate' ? 'Negotiation sent' : 'Proposal rejected');
      setReviewOpen(false);
      setSelectedProposal(null);
      setDecision({ type: '', reason: '', amount: '', message: '' });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update proposal status');
    }
  };

  const renderRiskFactors = (analysis) => {
    if (!analysis || !Array.isArray(analysis.risk_factors) || analysis.risk_factors.length === 0) {
      return [
        '✓ Sponsor profile verified',
        '✓ Good sponsorship history',
        '✓ No overdue payments',
        '✓ Requirements within package limits',
      ];
    }

    return analysis.risk_factors.map((risk) => `⚠ ${risk}`);
  };

  const openSponsorInsights = async (sponsor) => {
    try {
      const [recommendationsRes, reportRes] = await Promise.all([
        axios.get(`/api/admin/sponsorships/${sponsor.sponsor_id}/recommendations`, {
          headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@eventai.local' },
        }),
        axios.get(`/api/admin/sponsorships/${sponsor.sponsor_id}/reports`, {
          headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@eventai.local' },
        }),
      ]);

      setSelectedSponsorReport({
        sponsor,
        recommendations: recommendationsRes.data?.recommendations || [],
        report: reportRes.data || null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load sponsor AI recommendations');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Sponsorship Management</h1>
        <p className="text-slate-400">Overview, proposals, and sponsor review controls</p>
      </div>

      {!loading && (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Total Sponsors</span><Users className="text-cyan-400" size={18} /></div>
            <p className="text-3xl font-orbitron text-white mt-3">{stats.totalSponsors ?? 0}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Pending Proposals</span><FileText className="text-yellow-400" size={18} /></div>
            <p className="text-3xl font-orbitron text-white mt-3">{stats.pendingProposals ?? 0}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Approved Sponsorships</span><BadgeCheck className="text-emerald-400" size={18} /></div>
            <p className="text-3xl font-orbitron text-white mt-3">{stats.approvedSponsorships ?? 0}</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Total Sponsorship Value</span><CircleDollarSign className="text-purple-400" size={18} /></div>
            <p className="text-2xl font-orbitron text-white mt-3">{stats.totalSponsorshipValue ?? '₹0'}</p>
          </div>
        </div>
      )}

      <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2"><Handshake className="text-purple-400" size={18} /><h2 className="text-white font-semibold text-xl">Sponsorship Proposals</h2></div>

        <div className="grid md:grid-cols-4 gap-3">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input-glass rounded-xl px-4 py-2 text-sm">
            <option value="All">All</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Under Negotiation">Under Negotiation</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={filters.package} onChange={(e) => setFilters({ ...filters, package: e.target.value })} className="input-glass rounded-xl px-4 py-2 text-sm">
            <option value="All">All</option>
            <option value="Platinum">Platinum</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
          </select>
          <select value={filters.event} onChange={(e) => setFilters({ ...filters, event: e.target.value })} className="input-glass rounded-xl px-4 py-2 text-sm">
            <option value="All">All Events</option>
            {eventOptions.map((event) => <option key={event} value={event}>{event}</option>)}
          </select>
          <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="input-glass rounded-xl px-4 py-2 text-sm" placeholder="Search sponsor, event, proposal ID" />
        </div>

        {loading ? <div className="text-slate-400">Loading sponsorship proposals...</div> : (
          <div className="space-y-3">
            {filteredProposals.length === 0 ? <div className="text-slate-400">No proposals match current filters.</div> : filteredProposals.map((proposal) => (
              <div key={proposal.proposal_id} className="glass rounded-2xl p-5 border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold text-lg">{proposal.sponsor?.company_name || 'Sponsor'}</p>
                    <p className="text-slate-400 text-sm">{proposal.event?.name || 'Event'} • {proposal.package_name || 'Package'} • {proposal.amount ? `₹${Number(proposal.amount).toLocaleString('en-IN')}` : '₹0'}</p>
                    <p className="text-slate-500 text-xs mt-1">{proposal.proposal_id}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 text-xs">{proposal.status || 'Pending Review'}</span>
                    <button onClick={() => openReview(proposal.proposal_id)} className="btn-primary rounded-xl px-4 py-2 text-sm">Review</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-3xl p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="text-purple-400" size={18} /><h2 className="text-white font-semibold text-xl">Sponsor Performance</h2></div>
        <div className="grid md:grid-cols-3 gap-4 mb-5">
          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="text-slate-400 text-xs mb-1">Avg. Engagement</div>
            <div className="text-white font-orbitron text-3xl">{performanceOverview.overview?.avgEngagementScore ?? 0}</div>
          </div>
          <div className="glass rounded-2xl p-4 border border-emerald-500/20">
            <div className="text-emerald-300 text-xs mb-1">Strong Sponsors</div>
            <div className="text-emerald-400 font-orbitron text-3xl">{performanceOverview.overview?.strongSponsors ?? 0}</div>
          </div>
          <div className="glass rounded-2xl p-4 border border-cyan-500/20">
            <div className="text-cyan-300 text-xs mb-1">Total Sponsors</div>
            <div className="text-cyan-300 font-orbitron text-3xl">{performanceOverview.overview?.totalSponsors ?? 0}</div>
          </div>
        </div>

        <div className="space-y-3">
          {performanceOverview.records?.slice(0, 4).map((sponsor) => (
            <div key={sponsor.sponsor_id} className="glass rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{sponsor.company_name}</p>
                  <p className="text-slate-400 text-xs">{sponsor.performanceStatus} performance • {sponsor.totalSponsorships} approved sponsorships</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">{sponsor.engagementScore}/100</span>
                  <button onClick={() => openSponsorInsights(sponsor)} className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 text-[10px] border border-cyan-500/20">AI + Reports</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSponsorReport && (
        <div className="glass rounded-3xl p-6 border border-cyan-500/20">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-white font-semibold text-xl">AI Recommendations</h3>
              <p className="text-slate-400 text-sm">{selectedSponsorReport.sponsor.company_name}</p>
            </div>
            <button onClick={() => setSelectedSponsorReport(null)} className="text-slate-300 hover:text-white text-sm">Close</button>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              {selectedSponsorReport.recommendations.length ? selectedSponsorReport.recommendations.map((item) => (
                <div key={item.id || item.category} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs uppercase tracking-wider text-cyan-300">{item.category}</span>
                    <span className={`px-2 py-1 text-[10px] rounded-full border ${item.priority === 'High' ? 'bg-red-500/10 text-red-300 border-red-500/30' : item.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>{item.priority}</span>
                  </div>
                  <div className="text-white font-medium mb-2">{item.recommendation}</div>
                  <div className="text-slate-400 text-sm">{item.reason}</div>
                </div>
              )) : <div className="text-slate-400">No recommendations available.</div>}
            </div>
            <div className="glass rounded-2xl p-4 border border-white/10">
              <h4 className="text-white font-semibold mb-3">Report Snapshot</h4>
              {selectedSponsorReport.report ? (
                <div className="space-y-2 text-sm text-slate-300">
                  <p><span className="text-slate-400">Event:</span> {selectedSponsorReport.report.event_name}</p>
                  <p><span className="text-slate-400">Package:</span> {selectedSponsorReport.report.package_name}</p>
                  <p><span className="text-slate-400">Overall Score:</span> {selectedSponsorReport.report.performance?.overall_performance || selectedSponsorReport.sponsor.engagementScore || 0}%</p>
                  <p><span className="text-slate-400">Payment Status:</span> {selectedSponsorReport.report.payment?.status || 'Pending'}</p>
                  <p className="mt-3 whitespace-pre-line text-slate-200">{selectedSponsorReport.report.summary}</p>
                </div>
              ) : (
                <div className="text-slate-400">No sponsor performance report available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-3xl p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4"><ShieldCheck className="text-emerald-400" size={18} /><h2 className="text-white font-semibold text-xl">Sponsors</h2></div>
        <div className="grid md:grid-cols-2 gap-4">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="glass rounded-2xl p-4 border border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold">{sponsor.company_name}</p>
                  <p className="text-slate-400 text-xs">{sponsor.industry || 'Industry'} • {sponsor.active_sponsorships ?? 0} Active Sponsorships</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-emerald-900/30 text-emerald-300 text-xs">{sponsor.status || 'Active'}</span>
              </div>
              <div className="mt-3 text-sm text-slate-400">
                <p>Total Sponsorship Value: {`₹${Number(sponsor.total_sponsorship_value || 0).toLocaleString('en-IN')}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {reviewOpen && selectedProposal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass rounded-3xl p-6 border border-cyan-500/20 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-2xl">Proposal Review</h3>
                <button onClick={() => setReviewOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={18} /></button>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <h4 className="text-cyan-300 font-semibold mb-3">Sponsor Details</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p><span className="text-slate-400">Company:</span> {selectedProposal.sponsor?.company_name || 'N/A'}</p>
                      <p><span className="text-slate-400">Contact Person:</span> {selectedProposal.sponsor?.contact_person || 'N/A'}</p>
                      <p><span className="text-slate-400">Industry:</span> {selectedProposal.sponsor?.industry || 'N/A'}</p>
                      <p><span className="text-slate-400">Email:</span> {selectedProposal.sponsor?.email || 'N/A'}</p>
                      <p><span className="text-slate-400">Verification:</span> Verified</p>
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <h4 className="text-cyan-300 font-semibold mb-3">Proposal Details</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p><span className="text-slate-400">Proposal ID:</span> {selectedProposal.proposal_id}</p>
                      <p><span className="text-slate-400">Event:</span> {selectedProposal.event?.name || 'N/A'}</p>
                      <p><span className="text-slate-400">Package:</span> {selectedProposal.package_name || 'N/A'}</p>
                      <p><span className="text-slate-400">Amount:</span> ₹{Number(selectedProposal.amount || 0).toLocaleString('en-IN')}</p>
                      <p><span className="text-slate-400">Submitted:</span> {new Date(selectedProposal.submitted_at || selectedProposal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p><span className="text-slate-400">Status:</span> {selectedProposal.status || 'Pending Review'}</p>
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <h4 className="text-cyan-300 font-semibold mb-3">Customized Requirements</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p><span className="text-slate-400">Booth:</span> {selectedProposal.booth_required ? 'Premium' : 'Not Required'}</p>
                      <p><span className="text-slate-400">Booth Location:</span> {selectedProposal.booth_preference || 'Not specified'}</p>
                      <p><span className="text-slate-400">Branding:</span> {(selectedProposal.branding_requirements || []).join(', ') || 'None'}</p>
                      <p><span className="text-slate-400">Promotional Sessions:</span> {selectedProposal.promotional_sessions || 0}</p>
                      <p><span className="text-slate-400">Special Requirements:</span> {selectedProposal.special_requirements || 'None'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <h4 className="text-cyan-300 font-semibold mb-3">AI Sponsorship Analysis</h4>
                    <div className="space-y-3 text-sm text-slate-300">
                      <p><span className="text-slate-400">Sponsor Score</span> <span className="text-white font-semibold">{selectedProposal.ai_analysis?.sponsor_score ?? 92}%</span></p>
                      <p><span className="text-slate-400">Reliability</span> <span className="text-white font-semibold">{selectedProposal.ai_analysis?.reliability_score ?? 92}%</span></p>
                      <p><span className="text-slate-400">Proposal Risk</span> <span className="text-white font-semibold">{selectedProposal.ai_analysis?.proposal_risk ?? 'Low'}</span></p>
                      <p><span className="text-slate-400">Package Suitability</span> <span className="text-white font-semibold">{selectedProposal.ai_analysis?.package_suitability ?? 'High'}</span></p>
                      <p><span className="text-slate-400">Expected Engagement</span> <span className="text-white font-semibold">{selectedProposal.ai_analysis?.expected_engagement ?? 'High'}</span></p>
                      <p><span className="text-slate-400">AI Recommendation</span> <span className="text-white font-semibold">{selectedProposal.ai_analysis?.recommendation ?? 'Suitable for Approval'}</span></p>
                    </div>
                    <div className="mt-4 text-sm text-slate-300">
                      <p className="text-slate-400 mb-2">AI Explanation</p>
                      <p>{selectedProposal.ai_analysis?.explanation || 'This proposal shows strong alignment with the event requirements and has a low risk profile.'}</p>
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <h4 className="text-cyan-300 font-semibold mb-3">Risk Factors</h4>
                    <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
                      {renderRiskFactors(selectedProposal.ai_analysis).map((risk) => <li key={risk}>{risk}</li>)}
                    </ul>
                  </div>

                  <div className="glass rounded-2xl p-4 border border-white/10">
                    <div className="grid sm:grid-cols-3 gap-2">
                      <button onClick={() => applyDecision('approve')} className="btn-primary rounded-xl px-4 py-2">Approve</button>
                      <button onClick={() => setDecision((prev) => ({ ...prev, type: 'negotiate' }))} className="btn-ghost rounded-xl px-4 py-2">Negotiate</button>
                      <button onClick={() => setDecision((prev) => ({ ...prev, type: 'reject' }))} className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2">Reject</button>
                    </div>
                    {decision.type === 'negotiate' && (
                      <div className="mt-4 space-y-3">
                        <input value={decision.amount} onChange={(e) => setDecision({ ...decision, amount: e.target.value })} className="input-glass rounded-xl px-4 py-2 w-full" placeholder="Proposed amount" />
                        <textarea value={decision.message} onChange={(e) => setDecision({ ...decision, message: e.target.value })} className="input-glass rounded-xl px-4 py-2 w-full h-24" placeholder="Negotiation message" />
                        <button onClick={() => applyDecision('negotiate')} className="btn-primary rounded-xl px-4 py-2 w-full">Send Negotiation</button>
                      </div>
                    )}
                    {decision.type === 'reject' && (
                      <div className="mt-4 space-y-3">
                        <textarea value={decision.reason} onChange={(e) => setDecision({ ...decision, reason: e.target.value })} className="input-glass rounded-xl px-4 py-2 w-full h-24" placeholder="Enter rejection reason" />
                        <button onClick={() => applyDecision('reject')} className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-2 w-full">Confirm Rejection</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SchedulePanel() {
  const [sessions, setSessions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setSessions(getSessions().sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      setVenues(getVenues());
      setSpeakers(getSpeakers());
    } catch { toast.error("Failed to load schedule"); } finally { setLoading(false); }
  }, []);

  const venueName = (id) => venues.find((v) => Number(v.venue_id) === Number(id))?.name || "TBA";
  const speakerName = (id) => speakers.find((s) => Number(s.speaker_id) === Number(id))?.name || "TBA";

  const grouped = sessions.reduce((acc, s) => {
    const day = new Date(s.start_time).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Schedule</h1>
        <p className="text-slate-400">Chronological view of all scheduled sessions</p>
      </div>

      {loading && <div className="text-slate-400">Loading schedule...</div>}

      {!loading && sessions.length === 0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center text-slate-400">No sessions scheduled.</div>
      )}

      {!loading && Object.entries(grouped).map(([day, daySessions]) => (
        <div key={day}>
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3 px-1">{day}</h2>
          <div className="space-y-3">
            {daySessions.map((session) => (
              <motion.div key={session.session_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass rounded-2xl p-4 border border-white/10 flex gap-4 items-start">
                <div className="text-center min-w-[60px]">
                  <p className="text-cyan-400 text-sm font-bold">{new Date(session.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="text-slate-500 text-xs">{new Date(session.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{session.title || session.session_name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {venueName(session.venue_id)}</span>
                    <span className="flex items-center gap-1"><Mic2 size={11} /> {speakerName(session.speaker_id)}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {session.expectedAttendance}</span>
                    <span className="capitalize">{session.sessionType}</span>
                  </div>
                </div>
                <StatusBadge status={session.status} />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── VENUE OPTIMIZATION PANEL ─────────────────────────────────────────────────

export function VenueOptimizationPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    try {
      const sessions = getSessions();
      const venues = getVenues();
      const result = sessions.map((session) => {
        const opt = optimizeVenue(session);
        const venue = venues.find((v) => Number(v.venue_id) === Number(session.venue_id));
        return {
          session_id: session.session_id,
          session_name: session.title || session.session_name,
          venue_name: venue?.name || "Unassigned",
          expected_attendance: session.expectedAttendance || 0,
          venue_capacity: venue?.capacity || 0,
          utilization: opt.utilization,
          recommendation: opt.recommendation,
          action: opt.action,
          alternativeVenue: opt.alternativeVenue,
        };
      });
      setRows(result);
    } catch { toast.error("Failed to load optimization data"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const actionColor = { keep: "text-emerald-300", upgrade: "text-red-300", downgrade: "text-yellow-300", assign: "text-cyan-300" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Venue Optimization</h1>
          <p className="text-slate-400">AI-assisted utilization recommendations for all sessions</p>
        </div>
        <button onClick={load} className="btn-ghost rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading && <div className="text-slate-400">Analyzing sessions...</div>}

      {!loading && rows.length === 0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center text-slate-400">No sessions to optimize.</div>
      )}

      {!loading && rows.length > 0 && (
        <div className="space-y-4">
          {rows.map((row) => (
            <motion.div key={row.session_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 border border-white/10">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-white font-semibold">{row.session_name}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Venue: {row.venue_name} • Expected: {row.expected_attendance} • Capacity: {row.venue_capacity}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-orbitron font-bold text-cyan-400">{row.utilization}%</span>
                  <p className="text-slate-500 text-xs">utilization</p>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                <div className={`h-2 rounded-full transition-all duration-700 ${row.utilization > 85 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                  row.utilization < 35 ? "bg-gradient-to-r from-yellow-500 to-amber-500" :
                    "bg-gradient-to-r from-cyan-500 to-blue-500"
                  }`} style={{ width: `${Math.min(row.utilization, 100)}%` }} />
              </div>
              <p className={`text-sm font-medium ${actionColor[row.action] || "text-slate-300"}`}>
                [{row.action?.toUpperCase()}] {row.recommendation}
              </p>
              {row.alternativeVenue && (
                <p className="text-slate-500 text-xs mt-1">
                  Suggested alternative: {row.alternativeVenue.name} (cap: {row.alternativeVenue.capacity})
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CONFLICTS PANEL ──────────────────────────────────────────────────────────

export function ConflictsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    try { setData(detectConflicts()); } catch { toast.error("Failed to load conflicts"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const venueConflicts = data?.venueConflicts || [];
  const speakerConflicts = data?.speakerConflicts || [];
  const capacityConflicts = data?.capacityConflicts || [];
  const availabilityConflicts = data?.availabilityConflicts || [];

  const total = venueConflicts.length + speakerConflicts.length + capacityConflicts.length + availabilityConflicts.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Conflicts</h1>
          <p className="text-slate-400">Venue, speaker, capacity, and availability conflict center</p>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="bg-red-900/30 text-red-300 text-sm px-4 py-2 rounded-xl border border-red-900/30 flex items-center gap-2">
              <AlertCircle size={16} /> {total} conflict{total !== 1 ? "s" : ""}
            </span>
          )}
          {total === 0 && !loading && (
            <span className="bg-emerald-900/30 text-emerald-300 text-sm px-4 py-2 rounded-xl border border-emerald-900/30 flex items-center gap-2">
              <CheckCircle2 size={16} /> All clear
            </span>
          )}
          <button onClick={load} className="btn-ghost rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Scan
          </button>
        </div>
      </div>

      {loading && <div className="text-slate-400">Scanning for conflicts...</div>}

      {!loading && (
        <div className="grid lg:grid-cols-2 gap-4">
          {[
            { title: "Venue Double-Booking", items: venueConflicts, render: (item) => `"${item.session_a}" and "${item.session_b}" both at venue #${item.venue_id} — ${new Date(item.start_time).toLocaleString()}`, color: "red" },
            { title: "Speaker Scheduling Conflicts", items: speakerConflicts, render: (item) => `Speaker #${item.speaker_id} double-booked: "${item.session_a}" vs "${item.session_b}"`, color: "orange" },
            { title: "Capacity Exceeded", items: capacityConflicts, render: (item) => `"${item.session_name}" — expected ${item.expected_attendance} > venue capacity ${item.venue_capacity}`, color: "yellow" },
            { title: "Venue Availability Issues", items: availabilityConflicts, render: (item) => `"${item.session_name}" — venue "${item.venue_name}" is ${item.venue_status}`, color: "purple" },
          ].map(({ title, items, render, color }) => (
            <div key={title} className={`glass rounded-2xl p-5 border ${items.length > 0 ? `border-${color}-500/30` : "border-white/10"}`}>
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                {items.length > 0 ? <AlertCircle size={16} className={`text-${color}-400`} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
                {title} ({items.length})
              </h2>
              {items.length === 0 ? (
                <p className="text-slate-500 text-sm">No conflicts detected.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className={`text-sm text-slate-300 bg-${color}-900/10 border border-${color}-900/20 rounded-xl p-3`}>
                      {render(item)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS PANEL ──────────────────────────────────────────────────────────

export function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const load = useCallback(async (selectedRange = range) => {
    try {
      setLoading(true);
      setError('');
      const user = JSON.parse(localStorage.getItem('eventai_user') || '{}');
      const params = { range: selectedRange }
      if (selectedRange === 'custom') {
        params.startDate = customStart
        params.endDate = customEnd
      }

      const res = await axios.get('/api/admin/analytics/overview', {
        headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@example.com' },
        params,
      });

      setAnalytics(res.data || null);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics. Please try again.');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [customEnd, customStart, range]);

  useEffect(() => {
    load(range);
  }, [load, range]);

  const incidentData = analytics?.incidents || {};
  const sponsorshipData = analytics?.sponsorships || {};
  const incidentEntries = Object.entries(incidentData.byCategory || {}).sort((a, b) => b[1] - a[1]);
  const priorityEntries = Object.entries(incidentData.byPriority || {}).sort((a, b) => b[1] - a[1]);
  const statusEntries = Object.entries(incidentData.byStatus || {}).sort((a, b) => b[1] - a[1]);
  const locationEntries = Object.entries(incidentData.byLocation || {}).sort((a, b) => b[1] - a[1]);
  const trendEntries = Array.isArray(incidentData.trend) ? incidentData.trend : [];
  const packageEntries = Object.entries(sponsorshipData.packageBreakdown || {}).sort((a, b) => b[1] - a[1]);
  const sponsorPerformance = Array.isArray(sponsorshipData.sponsorPerformance) ? sponsorshipData.sponsorPerformance : [];
  const paymentEntries = Object.entries(sponsorshipData.paymentStatus || {}).sort((a, b) => b[1] - a[1]);
  const deliverableEntries = Object.entries(sponsorshipData.deliverableStatus || {}).sort((a, b) => b[1] - a[1]);

  const maxBarValue = (entries) => Math.max(1, ...entries.map(([, value]) => Number(value || 0)));
  const formatMoney = (value) => {
    const numeric = Number(value || 0);
    if (!numeric) return '₹0';
    return `₹${numeric.toLocaleString('en-IN')}`;
  };

  const handleApplyCustomRange = () => {
    setRange('custom');
    load('custom');
  };

  const renderBarChart = (items, colorClass = 'from-purple-500 to-cyan-500') => {
    if (!items || items.length === 0) {
      return <div className="text-slate-400 text-sm">No data available for the selected period.</div>;
    }

    const max = maxBarValue(items);
    return (
      <div className="space-y-3">
        {items.map(([label, value]) => (
          <div key={label}>
            <div className="flex justify-between text-sm text-slate-300 mb-1">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width: `${(Number(value || 0) / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Analytics</h1>
          <p className="text-slate-400">Incident and sponsorship performance insights for admin decision making</p>
        </div>
        <button onClick={() => load(range)} className="btn-ghost rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="glass rounded-3xl p-4 border border-white/10">
        <div className="flex flex-wrap gap-2 items-center">
          {['today', '7', '30', '90'].map((option) => (
            <button
              key={option}
              onClick={() => { setRange(option); setShowCustomRange(false); }}
              className={`rounded-xl px-3 py-2 text-xs font-medium border ${range === option ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-slate-300 border-white/10'}`}
            >
              {option === 'today' ? 'Today' : option + ' Days'}
            </button>
          ))}
          <button
            onClick={() => setShowCustomRange((current) => !current)}
            className={`rounded-xl px-3 py-2 text-xs font-medium border ${showCustomRange ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-white/5 text-slate-300 border-white/10'}`}
          >
            Custom Range
          </button>
        </div>

        {showCustomRange && (
          <div className="mt-4 grid md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Start date</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="input-glass rounded-xl px-4 py-2 w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">End date</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="input-glass rounded-xl px-4 py-2 w-full" />
            </div>
            <button onClick={handleApplyCustomRange} className="btn-primary rounded-xl px-4 py-2 text-sm">Apply</button>
          </div>
        )}
      </div>

      {loading && <div className="text-slate-400">Loading analytics...</div>}
      {!loading && error && <div className="glass rounded-3xl p-6 border border-red-500/30 text-red-300">{error}</div>}

      {!loading && !error && analytics && (
        <>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Incident Performance</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { label: 'TOTAL INCIDENTS', value: incidentData.totalIncidents || 0 },
                  { label: 'OPEN INCIDENTS', value: incidentData.openIncidents || 0 },
                  { label: 'IN PROGRESS', value: incidentData.inProgressIncidents || 0 },
                  { label: 'WAITING FOR VERIFICATION', value: incidentData.waitingForVerification || 0 },
                  { label: 'VERIFIED', value: incidentData.verifiedIncidents || 0 },
                  { label: 'CLOSED', value: incidentData.closedIncidents || 0 },
                  { label: 'CRITICAL', value: incidentData.criticalIncidents || 0 },
                  { label: 'HIGH PRIORITY', value: incidentData.highPriorityIncidents || 0 },
                ].map((card) => (
                  <div key={card.label} className="glass rounded-2xl p-4 border border-white/10">
                    <div className="text-slate-400 text-[11px] uppercase tracking-wide">{card.label}</div>
                    <div className="text-3xl font-orbitron font-bold text-white mt-3">{card.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Incident Status</h3>
                {statusEntries.length > 0 ? renderBarChart(statusEntries, 'from-cyan-500 to-blue-500') : <div className="text-slate-400">No incident data available for the selected period.</div>}
              </div>

              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Incident Category</h3>
                {incidentEntries.length > 0 ? renderBarChart(incidentEntries, 'from-violet-500 to-purple-500') : <div className="text-slate-400">No incident data available for the selected period.</div>}
              </div>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Incident Priority</h3>
                {priorityEntries.length > 0 ? renderBarChart(priorityEntries, 'from-amber-500 to-orange-500') : <div className="text-slate-400">No incident data available for the selected period.</div>}
              </div>

              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Incidents Reported Over Time</h3>
                {trendEntries.length > 0 ? (
                  <div className="space-y-3">
                    {trendEntries.map(({ date, count }) => (
                      <div key={date}>
                        <div className="flex justify-between text-sm text-slate-300 mb-1">
                          <span>{new Date(date).toLocaleDateString()}</span>
                          <span>{count}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${(Number(count || 0) / Math.max(1, ...trendEntries.map((entry) => Number(entry.count || 0)))) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-slate-400">No incident data available for the selected period.</div>}
              </div>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Resolution Performance</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { label: 'Average Resolution Time', value: incidentData.averageResolutionTime || 'Not enough data' },
                    { label: 'Average Response Time', value: incidentData.averageResponseTime || 'Not enough data' },
                    { label: 'Average Verification Time', value: incidentData.averageVerificationTime || 'Not enough data' },
                    { label: 'Average Closure Time', value: incidentData.averageClosureTime || 'Not enough data' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="text-slate-400 text-xs uppercase">{item.label}</div>
                      <div className="text-xl font-bold text-white mt-2">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Staff Workload</h3>
                {incidentData.staffWorkload && incidentData.staffWorkload.length > 0 ? (
                  <div className="space-y-3">
                    {incidentData.staffWorkload.map((member) => (
                      <div key={member.name} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white font-medium">{member.name}</span>
                          <span className="text-slate-300">Assigned: {member.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${Math.min((member.count / Math.max(1, ...incidentData.staffWorkload.map((entry) => Number(entry.count || 0)))) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-slate-400">No staff workload data available.</div>}
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Incident Location</h3>
              {locationEntries.length > 0 ? renderBarChart(locationEntries, 'from-emerald-500 to-teal-500') : <div className="text-slate-400">No location data available for the selected period.</div>}
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">AI Operational Summary</h3>
              <p className="text-slate-300">{incidentData.summary || 'No incident data available for the selected period.'}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Sponsorship Performance</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-3">
                {[
                  { label: 'TOTAL SPONSORS', value: sponsorshipData.totalSponsors || 0 },
                  { label: 'ACTIVE SPONSORS', value: sponsorshipData.activeSponsors || 0 },
                  { label: 'PENDING PAYMENTS', value: sponsorshipData.pendingPayments || 0 },
                  { label: 'PENDING DELIVERABLES', value: sponsorshipData.pendingDeliverables || 0 },
                  { label: 'ACTIVE PACKAGES', value: sponsorshipData.activePackages || 0 },
                  { label: 'TOTAL SPONSORSHIP VALUE', value: formatMoney(sponsorshipData.totalSponsorshipValue) },
                ].map((card) => (
                  <div key={card.label} className="glass rounded-2xl p-4 border border-white/10">
                    <div className="text-slate-400 text-[11px] uppercase tracking-wide">{card.label}</div>
                    <div className="text-2xl font-orbitron font-bold text-white mt-3">{card.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Sponsorship Package Analytics</h3>
                {packageEntries.length > 0 ? renderBarChart(packageEntries, 'from-purple-500 to-indigo-500') : <div className="text-slate-400">No sponsorship package data available for the selected period.</div>}
              </div>

              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Payment Analytics</h3>
                {paymentEntries.length > 0 ? renderBarChart(paymentEntries, 'from-emerald-500 to-green-500') : <div className="text-slate-400">No payment data available for the selected period.</div>}
              </div>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Deliverable Status</h3>
                {deliverableEntries.length > 0 ? renderBarChart(deliverableEntries, 'from-cyan-500 to-violet-500') : <div className="text-slate-400">No sponsor deliverable data available for the selected period.</div>}
              </div>

              <div className="glass rounded-3xl p-5 border border-white/10">
                <h3 className="text-white font-semibold mb-4">Sponsor Performance</h3>
                {sponsorPerformance.length > 0 ? (
                  <div className="space-y-3">
                    {sponsorPerformance.map((sponsor) => (
                      <div key={sponsor.name} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-white font-medium">{sponsor.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${sponsor.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                            {sponsor.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-300 mt-2">Deliverables: {sponsor.deliverablesCompleted}</div>
                        <div className="text-sm text-slate-300">Requirements: {sponsor.requirementsCompleted}</div>
                        <div className="text-sm text-slate-300">Pending items: {sponsor.pendingItems}</div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-slate-400">No sponsorship performance data available.</div>}
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">AI Operational Summary</h3>
              <p className="text-slate-300">{sponsorshipData.summary || 'No sponsorship data available for the selected period.'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ATTENDANCE PANEL ─────────────────────────────────────────────────────────

export function AttendancePanel() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ email: "", session_id: "", status: "checked-in" });

  const load = useCallback(() => {
    try {
      setAttendance(getAttendance().slice().reverse());
      setSessions(getSessions());
    } catch { toast.error("Failed to load attendance"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRecord = () => {
    if (!form.email.trim()) return toast.error("Participant email is required");
    if (!form.session_id) return toast.error("Please select a session");
    try {
      recordAttendance({ participant_email: form.email.trim(), session_id: Number(form.session_id), status: form.status, check_in: new Date().toISOString() });
      toast.success("Attendance recorded");
      setForm({ email: "", session_id: "", status: "checked-in" });
      load();
    } catch (err) { toast.error(err.message || "Failed to record attendance"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Attendance</h1>
        <p className="text-slate-400">Record and view check-in / check-out history</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10">
        <h2 className="text-white font-semibold mb-4">Record Attendance</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <input type="email" placeholder="Participant email" className="input-glass rounded-xl px-4 py-3"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="input-glass rounded-xl px-4 py-3" value={form.session_id}
            onChange={(e) => setForm({ ...form, session_id: e.target.value })}>
            <option value="">Select session…</option>
            {sessions.map((s) => <option key={s.session_id} value={s.session_id}>{s.title || s.session_name}</option>)}
          </select>
          <select className="input-glass rounded-xl px-4 py-3" value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="checked-in">Checked In</option>
            <option value="checked-out">Checked Out</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <button onClick={handleRecord} className="btn-primary rounded-xl px-6 py-2">Record</button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10">
        <h2 className="text-white font-semibold mb-4">Recent Records</h2>
        {loading && <div className="text-slate-400">Loading...</div>}
        <div className="space-y-2">
          {attendance.slice(0, 15).map((record, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-white/10">
              <div>
                <p className="text-white text-sm font-medium">{record.participant_email}</p>
                <p className="text-slate-400 text-xs">
                  {record.check_in ? new Date(record.check_in).toLocaleString() : "Pending"}
                  {" · Session #" + record.session_id}
                </p>
              </div>
              <StatusBadge status={record.status} />
            </div>
          ))}
          {attendance.length === 0 && !loading && <p className="text-slate-500 text-sm">No attendance records yet.</p>}
        </div>
      </motion.div>
    </div>
  );
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "", type: "info", recipient_role: "admin" });

  const load = useCallback(() => {
    try { setNotifications(getNotifications().slice().reverse()); } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = () => {
    if (!form.title.trim() || !form.message.trim()) return toast.error("Title and message are required");
    try {
      notifyUsers([{ ...form, recipient_email: `${form.recipient_role}@eventai.local` }]);
      toast.success("Notification sent");
      setForm({ title: "", message: "", type: "info", recipient_role: "admin" });
      load();
    } catch (err) { toast.error(err.message || "Failed to send notification"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Notifications</h1>
        <p className="text-slate-400">Send and view system notifications</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Bell size={18} className="text-purple-400" /> Send Notification</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input className="input-glass rounded-xl px-4 py-3" placeholder="Title"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="input-glass rounded-xl px-4 py-3" value={form.recipient_role}
            onChange={(e) => setForm({ ...form, recipient_role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <textarea rows="3" className="input-glass rounded-xl px-4 py-3 md:col-span-2" placeholder="Message"
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <button onClick={handleSend} className="btn-primary rounded-xl px-6 py-2">Send</button>
      </motion.div>

      {!loading && notifications.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 border border-white/10">
          <div className="space-y-3">
            {notifications.slice(0, 20).map((notif) => (
              <div key={notif.notification_id}
                className={`p-4 rounded-2xl border ${notif.is_read ? "bg-white/5 border-white/10" : "bg-purple-900/20 border-purple-600/30"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{notif.title}</p>
                    <p className="text-slate-400 text-sm mt-1">{notif.message}</p>
                    <p className="text-slate-600 text-xs mt-1">→ {notif.recipient_role}</p>
                  </div>
                  <span className="text-xs text-slate-500 ml-4">{new Date(notif.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      {!loading && notifications.length === 0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center text-slate-400">No notifications.</div>
      )}
    </div>
  );
}

export function OperationalAlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadAlerts = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('eventai_user') || '{}');
      const headers = { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@example.com' };

      const [alertRes, triggerRes] = await Promise.all([
        axios.get('/api/admin/alerts', { headers }),
        axios.post('/api/admin/alerts/generate', {}, { headers }).catch(() => null),
      ]);

      const list = Array.isArray(alertRes?.data) ? alertRes.data : [];
      const refreshed = Array.isArray(triggerRes?.data?.alerts) ? triggerRes.data.alerts : list;
      setAlerts(refreshed);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAlerts([]);
      toast.error('Failed to load operational alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateAlerts = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('eventai_user') || '{}');
      const res = await axios.post('/api/admin/alerts/generate', {}, {
        headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@example.com' }
      });
      if (res.data?.ok !== false) {
        toast.success(res.data?.summary || 'Operational alerts refreshed');
      }
      await loadAlerts();
    } catch (error) {
      console.error('Failed to generate alerts:', error);
      toast.error(error.response?.data?.message || 'Alert generation is temporarily unavailable.');
    }
  }, [loadAlerts]);

  const updateStatus = useCallback(async (alertId, action) => {
    try {
      const user = JSON.parse(localStorage.getItem('eventai_user') || '{}');
      const res = await axios.patch(`/api/admin/alerts/${alertId}/${action}`, {}, {
        headers: { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@example.com' }
      });
      if (res.data?.ok) {
        toast.success(`Alert ${action}d`);
        await loadAlerts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} alert.`);
    }
  }, [loadAlerts]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesFilter = filter === 'ALL' || String(alert.priority).toUpperCase() === filter || String(alert.status).toUpperCase() === filter;
    const text = `${alert.title || ''} ${alert.description || ''} ${alert.alertId || alert.id || ''} ${alert.sourceLabel || ''}`.toLowerCase();
    const matchesSearch = !search || text.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    CRITICAL: alerts.filter((alert) => String(alert.priority).toUpperCase() === 'CRITICAL').length,
    HIGH: alerts.filter((alert) => String(alert.priority).toUpperCase() === 'HIGH').length,
    MEDIUM: alerts.filter((alert) => String(alert.priority).toUpperCase() === 'MEDIUM').length,
    LOW: alerts.filter((alert) => String(alert.priority).toUpperCase() === 'LOW').length,
    INFORMATIONAL: alerts.filter((alert) => String(alert.priority).toUpperCase() === 'INFORMATIONAL').length,
    ACTIVE: alerts.filter((alert) => String(alert.status).toUpperCase() === 'ACTIVE').length,
    UNREAD: alerts.filter((alert) => String(alert.status).toUpperCase() !== 'RESOLVED' && String(alert.status).toUpperCase() !== 'DISMISSED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Operational Alerts</h1>
          <p className="text-slate-400">Real-time operational awareness for admin review and action</p>
        </div>
        <button onClick={generateAlerts} className="btn-primary rounded-xl px-5 py-3 flex items-center gap-2">
          <RefreshCw size={18} /> Refresh Alerts
        </button>
      </div>

      <div className="grid md:grid-cols-6 gap-3">
        {[
          ['CRITICAL', counts.CRITICAL],
          ['HIGH', counts.HIGH],
          ['MEDIUM', counts.MEDIUM],
          ['LOW', counts.LOW],
          ['ACTIVE', counts.ACTIVE],
          ['UNREAD', counts.UNREAD],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-2xl p-4 border border-white/10">
            <div className="text-slate-400 text-xs uppercase">{label}</div>
            <div className="text-2xl font-bold text-white mt-2">{value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts, incident ID, location, or sponsor"
            className="input-glass rounded-xl px-4 py-3 w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`rounded-xl px-3 py-2 text-xs font-medium border ${filter === option ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-slate-300 border-white/10'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-slate-400">Loading operational alerts...</div>}

      {!loading && filteredAlerts.length === 0 && (
        <div className="glass rounded-3xl p-10 border border-white/10 text-center text-slate-400">
          No operational alerts match the current filters.
        </div>
      )}

      {!loading && filteredAlerts.length > 0 && (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div key={alert.alertId || alert.id} className="glass rounded-3xl p-5 border border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${String(alert.priority).toUpperCase() === 'CRITICAL' ? 'bg-red-900/30 text-red-300' : String(alert.priority).toUpperCase() === 'HIGH' ? 'bg-orange-900/30 text-orange-300' : String(alert.priority).toUpperCase() === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-300' : String(alert.priority).toUpperCase() === 'LOW' ? 'bg-slate-800 text-slate-300' : 'bg-cyan-900/30 text-cyan-300'}`}>
                      {String(alert.priority || 'MEDIUM').toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-300 uppercase">{String(alert.type || 'ALERT')}</span>
                    <span className="text-xs text-slate-400">{alert.alertId || `#${alert.id}`}</span>
                    <span className="text-xs text-slate-400">{String(alert.status || 'ACTIVE')}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{alert.title}</h3>
                  <p className="text-slate-300">{alert.description}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {String(alert.status).toUpperCase() === 'ACTIVE' && (
                    <button onClick={() => updateStatus(alert.alertId || alert.id, 'acknowledge')} className="btn-primary rounded-xl px-4 py-2 text-sm">Acknowledge</button>
                  )}
                  {String(alert.status).toUpperCase() === 'ACKNOWLEDGED' && (
                    <button onClick={() => updateStatus(alert.alertId || alert.id, 'resolve')} className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-4 py-2 text-sm">Resolve</button>
                  )}
                  {String(alert.status).toUpperCase() !== 'DISMISSED' && (
                    <button onClick={() => updateStatus(alert.alertId || alert.id, 'dismiss')} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-4 py-2 text-sm">Dismiss</button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4 text-sm text-slate-300">
                <div className="bg-white/5 p-3 rounded-xl"><span className="text-slate-400 block text-xs uppercase">Source</span>{alert.sourceLabel || alert.sourceType || 'System'}</div>
                <div className="bg-white/5 p-3 rounded-xl"><span className="text-slate-400 block text-xs uppercase">Created</span>{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}</div>
                <div className="bg-white/5 p-3 rounded-xl"><span className="text-slate-400 block text-xs uppercase">Status</span>{alert.status || 'ACTIVE'}</div>
                <div className="bg-white/5 p-3 rounded-xl"><span className="text-slate-400 block text-xs uppercase">Related</span>{alert.relatedEntity?.location || alert.relatedEntity?.sponsorName || alert.relatedEntity?.title || 'System'}</div>
              </div>

              <div className="mt-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 text-sm text-slate-200">
                <div className="font-medium text-white mb-1">Recommended action</div>
                <div>{alert.recommendedAction || 'Review the issue and coordinate on-site operational support.'}</div>
              </div>

              {alert.reason && (
                <div className="mt-3 text-sm text-slate-300">
                  <span className="font-medium text-white">Reason:</span> {alert.reason}
                </div>
              )}

              {Array.isArray(alert.timeline) && alert.timeline.length > 0 && (
                <div className="mt-4 text-sm text-slate-300">
                  <div className="font-medium text-white mb-2">Timeline</div>
                  <div className="space-y-2">
                    {alert.timeline.slice(-3).map((entry, index) => (
                      <div key={`${entry.action}-${index}`} className="bg-white/5 rounded-xl p-3">
                        <div className="flex justify-between gap-3">
                          <span className="text-white font-medium">{entry.action}</span>
                          <span className="text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-400 mt-1">{entry.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OperationalMonitoringPanel() {
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [monitoring, setMonitoring] = useState({
    overview: null,
    alerts: [],
    events: [],
    sessions: [],
    venueUtilization: [],
  });

  const loadData = useCallback(async (selectedRange = range) => {
    try {
      setError('');
      const user = JSON.parse(localStorage.getItem('eventai_user') || '{}');
      const headers = { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@example.com' };
      const params = { range: selectedRange };

      const [overviewRes, alertsRes, eventsRes, sessionsRes, utilizationRes] = await Promise.all([
        axios.get('/api/admin/analytics/overview', { headers, params }),
        axios.get('/api/admin/alerts', { headers }),
        axios.get('/api/admin/events', { headers }),
        axios.get('/api/admin/sessions', { headers }),
        axios.get('/api/admin/analytics/venue-utilization', { headers, params }),
      ]);

      const overview = overviewRes?.data || {};
      const alerts = Array.isArray(alertsRes?.data) ? alertsRes.data : [];
      const events = Array.isArray(eventsRes?.data) ? eventsRes.data : [];
      const sessions = Array.isArray(sessionsRes?.data) ? sessionsRes.data : [];
      const venueUtilization = Array.isArray(utilizationRes?.data) ? utilizationRes.data : [];

      const activeAlerts = alerts.filter((alert) => !['RESOLVED', 'DISMISSED'].includes(String(alert.status || '').toUpperCase()));
      const eventHealth = events.map((event) => {
        const eventSessions = sessions.filter((session) => Number(session.event_id) === Number(event.event_id || event.id));
        const readyCount = eventSessions.filter((session) => session.venue_id && session.speaker_id).length;
        return {
          ...event,
          sessionCount: eventSessions.length,
          readiness: `${Math.min(100, Math.round((readyCount / Math.max(1, eventSessions.length)) * 100))}%`,
        };
      });

      setMonitoring({
        overview,
        alerts,
        activeAlerts,
        events,
        sessions,
        venueUtilization,
        eventHealth,
      });
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load monitoring dashboard:', err);
      setError('Unable to load the monitoring dashboard. Please try again.');
      setMonitoring({ overview: null, alerts: [], events: [], sessions: [], venueUtilization: [] });
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData(range);
  }, [loadData, range]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadData(range);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadData, range]);

  const incidentData = monitoring.overview?.incidents || {};
  const sponsorshipData = monitoring.overview?.sponsorships || {};
  const activeAlerts = monitoring.activeAlerts || [];
  const upcomingSessions = (monitoring.sessions || []).filter((session) => new Date(session.start_time || session.startTime) > new Date()).slice(0, 4);
  const criticalEvents = (monitoring.eventHealth || []).filter((event) => String(event.status || '').toUpperCase() === 'ACTIVE' || String(event.status || '').toUpperCase() === 'PUBLISHED').slice(0, 4);
  const staffWorkload = Array.isArray(incidentData.staffWorkload) ? incidentData.staffWorkload.slice(0, 5) : [];
  const venueUtilizationAverage = monitoring.venueUtilization.length
    ? Math.round(monitoring.venueUtilization.reduce((sum, item) => sum + Number(item.utilization_percentage || 0), 0) / monitoring.venueUtilization.length)
    : 0;

  const summaryCards = [
    { label: 'Open Incidents', value: incidentData.openIncidents || 0, color: 'from-red-500 to-orange-500' },
    { label: 'Critical Alerts', value: activeAlerts.filter((alert) => String(alert.priority || '').toUpperCase() === 'CRITICAL').length, color: 'from-rose-500 to-pink-500' },
    { label: 'AI Recommendations', value: activeAlerts.length, color: 'from-cyan-500 to-blue-500' },
    { label: 'Venue Readiness', value: `${venueUtilizationAverage}%`, color: 'from-emerald-500 to-teal-500' },
    { label: 'Upcoming Sessions', value: upcomingSessions.length, color: 'from-violet-500 to-purple-500' },
    { label: 'Total Events', value: monitoring.events.length, color: 'from-indigo-500 to-cyan-500' },
  ];

  const formatTimestamp = (value) => value ? new Date(value).toLocaleString() : 'Never';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Operational Monitoring</h1>
          <p className="text-slate-400">Live event health, incident load, and operational readiness overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Polling live
          </div>
          <button onClick={() => loadData(range)} className="btn-ghost rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="glass rounded-3xl p-4 border border-white/10">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            {['today', '7', '30', '90'].map((option) => (
              <button
                key={option}
                onClick={() => setRange(option)}
                className={`rounded-xl px-3 py-2 text-xs font-medium border ${range === option ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-slate-300 border-white/10'}`}
              >
                {option === 'today' ? 'Today' : `${option} Days`}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-400">Last sync: {formatTimestamp(lastUpdated)}</div>
        </div>
      </div>

      {loading && <div className="text-slate-400">Loading operational monitoring...</div>}
      {!loading && error && <div className="glass rounded-3xl p-6 border border-red-500/30 text-red-300">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {summaryCards.map((card) => (
              <div key={card.label} className={`bg-gradient-to-br ${card.color} bg-opacity-10 rounded-2xl p-5 border border-white/10`}>
                <div className="text-slate-400 text-xs uppercase tracking-wide">{card.label}</div>
                <div className="text-3xl font-orbitron font-bold text-white mt-3">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Event Health</h2>
              <div className="space-y-3">
                {criticalEvents.length > 0 ? criticalEvents.map((event) => (
                  <div key={event.event_id || event.id} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-medium">{event.name}</div>
                        <div className="text-xs text-slate-400">{event.location || 'Location TBD'} • {event.sessionCount || 0} sessions</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200">{event.status || 'ACTIVE'}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                      <span>Readiness</span>
                      <span>{event.readiness}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: event.readiness }} />
                    </div>
                  </div>
                )) : <div className="text-slate-400">No active events need attention.</div>}
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Active Operational Alerts</h2>
              <div className="space-y-3">
                {activeAlerts.length > 0 ? activeAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.alertId || alert.id} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <div className="flex justify-between gap-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${String(alert.priority || '').toUpperCase() === 'CRITICAL' ? 'bg-red-900/30 text-red-300' : String(alert.priority || '').toUpperCase() === 'HIGH' ? 'bg-orange-900/30 text-orange-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                        {String(alert.priority || 'MEDIUM').toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">{String(alert.status || 'ACTIVE')}</span>
                    </div>
                    <div className="mt-2 text-white font-medium">{alert.title}</div>
                    <div className="mt-1 text-sm text-slate-300">{alert.description}</div>
                  </div>
                )) : <div className="text-slate-400">No active alerts are currently requiring administration.</div>}
              </div>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Staff Workload</h2>
              <div className="space-y-3">
                {staffWorkload.length > 0 ? staffWorkload.map((member) => (
                  <div key={member.name} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium">{member.name}</span>
                      <span className="text-slate-300">{member.count} incidents</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${Math.min(100, (Number(member.count || 0) / Math.max(1, ...staffWorkload.map((entry) => Number(entry.count || 0)))) * 100)}%` }} />
                    </div>
                  </div>
                )) : <div className="text-slate-400">No staff workload data available for the selected period.</div>}
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Upcoming Session Watchlist</h2>
              <div className="space-y-3">
                {upcomingSessions.length > 0 ? upcomingSessions.map((session) => (
                  <div key={session.session_id || session.id} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="text-white font-medium">{session.session_name || session.title || 'Session'}</div>
                        <div className="text-xs text-slate-400">{new Date(session.start_time || session.startTime).toLocaleString()}</div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">{session.status || 'scheduled'}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Venue: {session.venue_id ? 'Assigned' : 'Pending'} • Speaker: {session.speaker_id ? 'Assigned' : 'Pending'}
                    </div>
                  </div>
                )) : <div className="text-slate-400">No upcoming sessions are scheduled.</div>}
              </div>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Venue Utilization</h2>
              <div className="space-y-3">
                {monitoring.venueUtilization.length > 0 ? monitoring.venueUtilization.slice(0, 5).map((venue) => (
                  <div key={venue.venue_id} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white font-medium">{venue.name}</span>
                      <span className="text-slate-300">{Number(venue.utilization_percentage || 0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.min(100, Number(venue.utilization_percentage || 0))}%` }} />
                    </div>
                  </div>
                )) : <div className="text-slate-400">No venue utilization data available.</div>}
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">AI Monitoring Summary</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p>{incidentData.summary || 'No incident summary available for the selected period.'}</p>
                <p>{sponsorshipData.summary || 'No sponsorship summary available for the selected period.'}</p>
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 text-slate-200">
                  <div className="font-medium text-white mb-1">Recommendation</div>
                  <div>
                    {activeAlerts.length > 0
                      ? 'Prioritize the latest critical and high-priority alerts before they accumulate into broader disruptions.'
                      : 'Operational conditions are stable and the system is tracking normal event readiness.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AIOperationsIntelligencePanel({ onNavigate }) {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [riskFilter, setRiskFilter] = useState('ALL');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const user = JSON.parse(localStorage.getItem('eventai_user') || '{}');
      const headers = { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@example.com' };
      const url = selectedEventId ? `/api/admin/intelligence/event/${selectedEventId}` : '/api/admin/intelligence';
      const res = await axios.get(url, { headers });
      setIntelligence(res.data || null);
    } catch (err) {
      console.error('Failed to load AI operations intelligence:', err);
      setError(err.response?.data?.message || 'Unable to load AI operations intelligence. Please try again.');
      setIntelligence(null);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatTimestamp = (value) => value ? new Date(value).toLocaleString() : 'N/A';

  const healthStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'EXCELLENT') return 'bg-emerald-900/50 text-emerald-300 border-emerald-500/40';
    if (s === 'HEALTHY') return 'bg-cyan-900/50 text-cyan-300 border-cyan-500/40';
    if (s === 'WARNING') return 'bg-yellow-900/50 text-yellow-300 border-yellow-500/40';
    if (s === 'CRITICAL') return 'bg-orange-900/50 text-orange-300 border-orange-500/40';
    return 'bg-red-900/50 text-red-300 border-red-500/40';
  };

  const priorityBadge = (priority) => {
    const p = String(priority || '').toUpperCase();
    if (p === 'P1' || p === 'CRITICAL') return 'bg-red-900/60 text-red-200 border border-red-500/50 font-bold';
    if (p === 'P2' || p === 'HIGH') return 'bg-orange-900/60 text-orange-200 border border-orange-500/50 font-bold';
    if (p === 'P3' || p === 'MEDIUM') return 'bg-yellow-900/60 text-yellow-200 border border-yellow-500/50';
    return 'bg-slate-800 text-slate-300 border border-slate-600/40';
  };

  const trendBadge = (trend) => {
    const t = String(trend || '').toUpperCase();
    if (t === 'IMPROVING') return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    if (t === 'STABLE') return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
    if (t === 'DECLINING') return 'bg-red-950/60 text-red-300 border-red-500/30';
    return 'bg-slate-900 text-slate-400 border-slate-700/30';
  };

  const filteredRisks = (intelligence?.risks || []).filter((risk) => {
    if (riskFilter === 'ALL') return true;
    return String(risk.severity || '').toUpperCase() === riskFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-orbitron text-3xl font-bold gradient-text">Event Intelligence Engine</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Milestone 4
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Real-time health monitoring, risk detection, trend analysis, & AI decision support</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
            className="input-glass rounded-xl px-4 py-2 bg-slate-900 text-sm text-white border border-white/10"
          >
            <option value="">All Events / Overall System</option>
            {getEvents().map((ev) => (
              <option key={ev.event_id || ev.id} value={ev.event_id || ev.id}>{ev.name}</option>
            ))}
          </select>
          <button onClick={loadData} className="btn-primary rounded-xl px-4 py-2 text-sm flex items-center gap-2">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {loading && <div className="text-slate-400 p-8 text-center glass rounded-3xl">Calculating real-time event health metrics...</div>}
      {!loading && error && <div className="glass rounded-3xl p-6 border border-red-500/30 text-red-300">{error}</div>}

      {!loading && !error && intelligence && (
        <>
          {/* Main Health Card */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900 to-cyan-950/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold text-cyan-300">Overall Health Status</span>
                  <span className={`text-xs px-3.5 py-1 rounded-full border font-bold ${healthStatusBadge(intelligence.healthStatus)}`}>
                    {intelligence.healthStatus}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white font-orbitron">
                  {intelligence.eventName}
                </h2>

                <p className="text-slate-300 text-sm">
                  Generated at {formatTimestamp(intelligence.generatedAt)} • Operational aggregated data
                </p>

                {/* Primary Factor Warning Banner */}
                {intelligence.primaryReducingFactorReason && (
                  <div className={`p-3.5 rounded-2xl border text-xs leading-5 ${intelligence.eventHealthScore < 75 ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'}`}>
                    <span className="font-bold uppercase tracking-wider block mb-0.5">💡 Primary Factor Analysis</span>
                    {intelligence.primaryReducingFactorReason}
                  </div>
                )}
              </div>

              {/* Big Score Gauge */}
              <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-3xl border border-white/10 min-w-[200px]">
                <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">Health Score</div>
                <div className={`text-5xl font-orbitron font-bold ${intelligence.eventHealthScore >= 90 ? 'text-emerald-400' : intelligence.eventHealthScore >= 75 ? 'text-cyan-400' : intelligence.eventHealthScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {intelligence.eventHealthScore}
                </div>
                <div className="text-slate-500 text-[11px] mt-1">out of 100</div>
              </div>
            </div>
          </div>

          {/* Health Breakdown Cards */}
          <div>
            <h3 className="text-white font-orbitron font-bold text-lg mb-4">Dimension Health Breakdown</h3>
            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
              {[
                { key: 'registration', label: 'Registration (20%)', score: intelligence.metrics?.registration ?? 100, tone: 'from-purple-500 to-violet-500' },
                { key: 'attendance', label: 'Attendance (20%)', score: intelligence.metrics?.attendance ?? 100, tone: 'from-cyan-500 to-blue-500' },
                { key: 'incidents', label: 'Incidents (25%)', score: intelligence.metrics?.incidents ?? 100, tone: 'from-red-500 to-orange-500' },
                { key: 'sponsorship', label: 'Sponsorship (15%)', score: intelligence.metrics?.sponsorship ?? 100, tone: 'from-emerald-500 to-teal-500' },
                { key: 'operations', label: 'Operations (20%)', score: intelligence.metrics?.operations ?? 100, tone: 'from-yellow-500 to-amber-500' },
              ].map((dim) => (
                <div key={dim.key} className="glass rounded-2xl p-4 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">{dim.label}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${dim.score >= 90 ? 'bg-emerald-950 text-emerald-300' : dim.score >= 75 ? 'bg-cyan-950 text-cyan-300' : 'bg-yellow-950 text-yellow-300'}`}>
                      {dim.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${dim.tone}`} style={{ width: `${Math.min(100, Math.max(0, dim.score))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Risk Detection & Trend Analysis */}
          <div className="grid xl:grid-cols-3 gap-6">
            {/* Risk Detection Engine Panel (2 Columns) */}
            <div className="xl:col-span-2 glass rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-white font-orbitron font-bold text-lg">Operational Risk Signals</h3>
                  <p className="text-slate-400 text-xs">Rule-based threat identification & severity metrics</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setRiskFilter(sev)}
                      className={`px-3 py-1 rounded-lg transition ${riskFilter === sev ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {filteredRisks.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8 bg-white/5 rounded-2xl">
                  No active risk signals detected matching filter "{riskFilter}".
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {filteredRisks.map((risk) => (
                    <div key={risk.id || risk.title} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-bold">
                            {risk.id}
                          </span>
                          <span className="text-white font-bold text-sm">{risk.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{risk.category}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full ${priorityBadge(risk.priority)}`}>
                            {risk.priority} ({risk.severity})
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-300 text-xs">{risk.description}</p>
                      <p className="text-slate-400 text-xs italic">Impact: {risk.impact}</p>

                      {risk.recommendedAction && (
                        <div className="bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/20 text-xs text-cyan-200">
                          <span className="font-semibold text-cyan-300">Action Required:</span> {risk.recommendedAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Operational Trends Section (1 Column) */}
            <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-white font-orbitron font-bold text-lg">Operational Trends</h3>
                <p className="text-slate-400 text-xs">Directional performance analysis</p>
              </div>

              <div className="space-y-3">
                {(intelligence.trends || []).map((tr) => (
                  <div key={tr.category} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold text-sm">{tr.category}</p>
                      <p className="text-slate-400 text-xs">{tr.metricName || 'Historical metric'}</p>
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${trendBadge(tr.trend)}`}>
                      <span>{tr.direction || '→'}</span>
                      <span>{tr.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights & Recommendation Engine */}
          <div className="grid xl:grid-cols-2 gap-6">
            {/* AI Insights */}
            <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
              <h3 className="text-white font-orbitron font-bold text-lg flex items-center gap-2">
                <Sparkles size={20} className="text-yellow-400 animate-pulse" /> AI Operational Insights
              </h3>

              <div className="space-y-3">
                {(intelligence.insights || []).map((insight, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-slate-300 leading-relaxed flex gap-3">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
              <h3 className="text-white font-orbitron font-bold text-lg">Action Recommendations</h3>

              <div className="space-y-3">
                {(intelligence.recommendations || []).map((rec) => (
                  <div key={rec.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm">{rec.title}</span>
                      <span className={`px-2.5 py-0.5 rounded-full ${priorityBadge(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-slate-300">{rec.description}</p>
                    <p className="text-slate-400 font-medium">Reason: {rec.reason}</p>
                    <div className="bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/20 text-purple-200">
                      <span className="font-bold text-purple-300">Suggested Action:</span> {rec.suggestedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consolidated Priority Actions List */}
          <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="text-white font-orbitron font-bold text-lg">Priority Actions (P1–P4 Urgent Queue)</h3>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(intelligence.priorityActions || []).map((act) => (
                <div key={act.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 text-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${priorityBadge(act.priorityLevel || act.priority)}`}>
                        {act.priorityLevel || act.priority} Priority
                      </span>
                      <span className="text-slate-500 text-[10px]">ID: {act.id}</span>
                    </div>
                    <p className="text-white font-bold text-sm">{act.title}</p>
                    <p className="text-slate-300 text-xs">{act.suggestedAction || act.description}</p>
                  </div>
                  <p className="text-emerald-400 text-[11px] pt-2 border-t border-white/5 font-semibold">
                    Expected Impact: {act.expectedImpact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function DecisionSupportPanel({ onNavigate }) {
  const [range, setRange] = useState('30');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [support, setSupport] = useState(null);

  const loadData = useCallback(async (selectedRange = range) => {
    try {
      const user = JSON.parse(localStorage.getItem('eventai_user') || '{}');
      const headers = { 'x-user-role': 'admin', 'x-user-email': user.email || 'admin@example.com' };
      const [overviewRes, intelligenceRes, alertRes] = await Promise.all([
        axios.get('/api/admin/analytics/overview', { headers, params: { range: selectedRange } }),
        axios.get('/api/admin/intelligence', { headers }),
        axios.get('/api/admin/alerts', { headers }),
      ]);

      const overview = overviewRes?.data || {};
      const intelligence = intelligenceRes?.data || {};
      const alerts = Array.isArray(alertRes?.data) ? alertRes.data : [];
      const incidents = overview.incidents || {};
      const sponsorships = overview.sponsorships || {};

      const openIncidents = Number(incidents.openIncidents || 0);
      const closedIncidents = Number(incidents.closedIncidents || 0);
      const resolvedIncidents = Number(incidents.resolvedIncidents || 0);
      const totalIncidents = Number(incidents.totalIncidents || 0);
      const criticalIncidents = Number(incidents.criticalIncidents || 0);
      const highPriorityIncidents = Number(incidents.highPriorityIncidents || 0);
      const avgResolutionTime = incidents.averageResolutionTime || 'Data unavailable';
      const allAlerts = alerts.filter((alert) => !['RESOLVED', 'DISMISSED'].includes(String(alert.status || '').toUpperCase()));
      const activeAlerts = allAlerts.length;
      const criticalAlerts = allAlerts.filter((alert) => String(alert.priority || '').toUpperCase() === 'CRITICAL').length;
      const totalAlerts = alerts.length;
      const resolvedAlerts = alerts.filter((alert) => ['RESOLVED', 'DISMISSED'].includes(String(alert.status || '').toUpperCase())).length;
      const sponsorPendingDeliverables = Number(sponsorships.pendingDeliverables || 0);
      const sponsorPendingPayments = Number(sponsorships.pendingPayments || 0);
      const totalSponsors = Number(sponsorships.totalSponsors || 0);
      const activeSponsors = Number(sponsorships.activeSponsors || 0);

      const sessionCount = Number(intelligence.observability?.sessionCount || 0);
      const venueCount = Number(intelligence.observability?.venueCount || 0);
      const eventCount = Number(intelligence.observability?.eventCount || 0);

      const performance = {
        overallPerformance: totalIncidents > 0 ? Math.max(55, 100 - Math.min(40, openIncidents * 5) - Math.min(20, criticalIncidents * 3) + Math.min(10, sponsorPendingDeliverables * 2)) : 88,
        operationalEfficiency: Math.max(60, 100 - Math.min(25, activeAlerts * 4) - Math.min(15, sponsorPendingPayments * 3) + Math.min(10, sessionCount * 0.4)),
        incidentResolution: totalIncidents > 0 ? Math.max(0, Math.round((resolvedIncidents / Math.max(1, totalIncidents)) * 100)) : 0,
        sponsorFulfillment: Math.max(0, 100 - Math.min(40, sponsorPendingDeliverables * 8) - Math.min(15, sponsorPendingPayments * 4)),
        sessionReadiness: Math.max(0, 100 - Math.min(15, Math.max(0, (Math.max(0, Number(intelligence.sessionIntelligence?.filter((item) => item.readiness === 'ATTENTION REQUIRED').length || 0)) * 10)))),
        alertResolution: totalAlerts > 0 ? Math.max(0, Math.round((resolvedAlerts / Math.max(1, totalAlerts)) * 100)) : 0,
      };

      const decisionInsights = [
        intelligence.keyRisks?.[0] ? `Primary concern: ${intelligence.keyRisks[0].title}.` : 'No major risk signals are currently active.',
        intelligence.sponsorshipIntelligence?.observation || 'Sponsorship commitments are being monitored within normal targets.',
        intelligence.trends?.summary || 'Trend data is limited for the current period.',
      ];

      const priorityAreas = [
        { level: 'HIGH', label: intelligence.keyRisks?.[0]?.title || 'Operational review required', details: intelligence.keyRisks?.[0]?.explanation || 'No active high-priority issue is currently identified.' },
        { level: 'MEDIUM', label: 'Sponsorship follow-up', details: sponsorPendingDeliverables > 0 ? `${sponsorPendingDeliverables} sponsor deliverables still require attention.` : 'Sponsor commitments are currently within expected levels.' },
        { level: 'LOW', label: 'Session readiness', details: sessionCount > 0 ? `${sessionCount} session(s) tracked; readiness remains within acceptable limits.` : 'Session readiness data is limited.' },
      ];

      const summary = {
        title: 'AI Decision Summary',
        body: intelligence.summary || 'Operational metrics remain available and the event is stable for continued admin monitoring.',
      };

      setSupport({
        overview: {
          eventCount,
          venueCount,
          sessionCount,
          totalIncidents,
          openIncidents,
          criticalIncidents,
          highPriorityIncidents,
          activeAlerts,
          totalAlerts,
          sponsorPendingDeliverables,
          sponsorPendingPayments,
          totalSponsors,
          activeSponsors,
          averageResolutionTime,
        },
        performance,
        decisionInsights,
        priorityAreas,
        summary,
        intelligence,
        alertBreakdown: {
          total: totalAlerts,
          resolved: resolvedAlerts,
          active: activeAlerts,
          critical: criticalAlerts,
        },
      });
      setError('');
    } catch (err) {
      console.error('Failed to load decision support dashboard:', err);
      setError('Unable to load the decision support dashboard. Please try again.');
      setSupport(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData(range);
  }, [loadData, range]);

  const filteredInsights = (support?.decisionInsights || []).filter((item) => {
    if (filter === 'ALL') return true;
    const normalized = filter.toUpperCase();
    if (normalized === 'INCIDENTS') return item.toLowerCase().includes('incident') || item.toLowerCase().includes('risk');
    if (normalized === 'ALERTS') return item.toLowerCase().includes('alert');
    if (normalized === 'SPONSORSHIP') return item.toLowerCase().includes('sponsor') || item.toLowerCase().includes('deliverable');
    if (normalized === 'VENUE' || normalized === 'SESSION') return item.toLowerCase().includes('session') || item.toLowerCase().includes('venue') || item.toLowerCase().includes('readiness');
    return true;
  });

  const badgeStyle = (value) => {
    if (value >= 90) return 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/20';
    if (value >= 75) return 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/20';
    if (value >= 60) return 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/20';
    return 'bg-red-900/30 text-red-300 border border-red-500/20';
  };

  const renderStatusLabel = (value) => {
    if (typeof value === 'number') {
      if (value >= 90) return 'EXCELLENT';
      if (value >= 75) return 'GOOD';
      if (value >= 60) return 'ATTENTION REQUIRED';
      return 'HIGH RISK';
    }
    return 'GOOD';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Event Performance & Decision Support</h1>
          <p className="text-slate-400">Aggregate operational metrics to understand performance, issue pressure, and admin decision priorities</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => loadData(range)} className="btn-ghost rounded-xl px-4 py-2 text-sm">Refresh</button>
          <button onClick={() => onNavigate?.('analytics')} className="btn-ghost rounded-xl px-4 py-2 text-sm">View Analytics</button>
        </div>
      </div>

      <div className="glass rounded-3xl p-4 border border-white/10">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {['30', '7', 'today', 'event'].map((option) => (
              <button
                key={option}
                onClick={() => setRange(option === 'event' ? '30' : option)}
                className={`rounded-xl px-3 py-2 text-xs font-medium border ${range === (option === 'event' ? '30' : option) ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-slate-300 border-white/10'}`}
              >
                {option === 'today' ? 'Today' : option === 'event' ? 'Event' : `${option} Days`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'INCIDENTS', 'STAFF', 'SPONSORSHIP', 'VENUE', 'SESSION', 'ALERTS'].map((option) => (
              <button key={option} onClick={() => setFilter(option)} className={`rounded-xl px-2.5 py-1.5 text-[11px] font-medium border ${filter === option ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-white/5 text-slate-300 border-white/10'}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="text-slate-400">Loading decision support dashboard...</div>}
      {!loading && error && <div className="glass rounded-3xl p-6 border border-red-500/30 text-red-300">{error}</div>}

      {!loading && !error && support && (
        <>
          <div className="glass rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-purple-950/20 via-slate-900 to-cyan-950/20">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">Event health</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle(support.performance.overallPerformance)}`}>
                    {renderStatusLabel(support.performance.overallPerformance)}
                  </span>
                  <span className="text-2xl font-bold text-white">Overall Performance: {support.performance.overallPerformance}%</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onNavigate?.('monitoring')} className="btn-ghost rounded-xl px-3 py-2 text-sm">Monitoring</button>
                <button onClick={() => onNavigate?.('reports')} className="btn-ghost rounded-xl px-3 py-2 text-sm">Reports</button>
                <button onClick={() => onNavigate?.('ai-intelligence')} className="btn-ghost rounded-xl px-3 py-2 text-sm">AI Intelligence</button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              { label: 'Overall Performance', value: `${support.performance.overallPerformance}%`, status: renderStatusLabel(support.performance.overallPerformance) },
              { label: 'Operational Efficiency', value: `${support.performance.operationalEfficiency}%`, status: renderStatusLabel(support.performance.operationalEfficiency) },
              { label: 'Incident Resolution', value: `${support.performance.incidentResolution}%`, status: renderStatusLabel(support.performance.incidentResolution) },
              { label: 'Sponsor Fulfillment', value: `${support.performance.sponsorFulfillment}%`, status: renderStatusLabel(support.performance.sponsorFulfillment) },
              { label: 'Session Readiness', value: `${support.performance.sessionReadiness}%`, status: renderStatusLabel(support.performance.sessionReadiness) },
              { label: 'Alert Resolution', value: `${support.performance.alertResolution}%`, status: renderStatusLabel(support.performance.alertResolution) },
            ].map((card) => (
              <div key={card.label} className="glass rounded-2xl p-4 border border-white/10">
                <div className="text-slate-400 text-[11px] uppercase tracking-wide">{card.label}</div>
                <div className="text-3xl font-orbitron font-bold text-white mt-3">{card.value}</div>
                <div className={`inline-flex mt-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${badgeStyle(Number(card.value.replace('%', '')) || 0)}`}>{card.status}</div>
              </div>
            ))}
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Incident Performance</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <div>Total incidents: {support.overview.totalIncidents}</div>
                <div>Open: {support.overview.openIncidents}</div>
                <div>Critical: {support.overview.criticalIncidents}</div>
                <div>High priority: {support.overview.highPriorityIncidents}</div>
                <div>Resolution rate: {support.performance.incidentResolution}%</div>
                <div>Average resolution time: {support.overview.averageResolutionTime}</div>
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Staff Performance</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <div>Active staff workloads: {support.intelligence.staffOperations?.activeStaffHandlingIncidents ?? 0}</div>
                <div>Highest current workload: {support.intelligence.staffOperations?.highestCurrentWorkload || 'Data unavailable'}</div>
                <div>Observation: {support.intelligence.staffOperations?.observation || 'Data unavailable'}</div>
              </div>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Sponsor Performance</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <div>Active sponsors: {support.overview.activeSponsors || 0}</div>
                <div>Pending deliverables: {support.overview.sponsorPendingDeliverables || 0}</div>
                <div>Pending payments: {support.overview.sponsorPendingPayments || 0}</div>
                <div>Fulfillment: {support.performance.sponsorFulfillment}%</div>
                <div>Observation: {support.intelligence.sponsorshipIntelligence?.observation || 'No sponsor signal available'}</div>
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Venue & Session Performance</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <div>Event count: {support.overview.eventCount || 0}</div>
                <div>Venue count: {support.overview.venueCount || 0}</div>
                <div>Session count: {support.overview.sessionCount || 0}</div>
                <div>Session readiness: {support.performance.sessionReadiness}%</div>
                <div>Alert signal: {support.alertBreakdown.active || 0} active alerts</div>
              </div>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Alert Performance</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <div>Total alerts: {support.alertBreakdown.total || 0}</div>
                <div>Resolved: {support.alertBreakdown.resolved || 0}</div>
                <div>Active: {support.alertBreakdown.active || 0}</div>
                <div>Critical: {support.alertBreakdown.critical || 0}</div>
                <div>Resolution rate: {support.performance.alertResolution}%</div>
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">AI Recommendation Outcomes</h2>
              <div className="space-y-3 text-sm text-slate-300">
                <div>Generated: {support.intelligence.recommendationIntelligence?.active || 0}</div>
                <div>Accepted: {support.intelligence.recommendationIntelligence?.accepted || 0}</div>
                <div>Completed: {support.intelligence.recommendationIntelligence?.completed || 0}</div>
                <div>Pending: {Math.max(0, (support.intelligence.recommendationIntelligence?.active || 0) - (support.intelligence.recommendationIntelligence?.completed || 0))}</div>
              </div>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Decision Support Insights</h2>
              <div className="space-y-3 text-sm text-slate-300">
                {filteredInsights.map((item, index) => (
                  <div key={`${item}-${index}`} className="bg-white/5 rounded-2xl p-3 border border-white/10">{item}</div>
                )) || <div className="text-slate-400">No decision support insights available for this filter.</div>}
              </div>
            </div>

            <div className="glass rounded-3xl p-5 border border-white/10">
              <h2 className="text-white font-semibold mb-4">Priority Areas</h2>
              <div className="space-y-3">
                {support.priorityAreas?.map((area) => (
                  <div key={area.level} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${area.level === 'HIGH' ? 'bg-red-900/30 text-red-300' : area.level === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-emerald-900/30 text-emerald-300'}`}>{area.level}</span>
                      <span className="text-white font-medium text-sm">{area.label}</span>
                    </div>
                    <div className="text-sm text-slate-300">{area.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 border border-white/10">
            <h2 className="text-white font-semibold mb-4">AI Decision Summary</h2>
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 text-slate-200 text-sm">
              {support.summary?.body || 'AI decision summary temporarily unavailable. Performance metrics remain available.'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADMIN INCIDENTS PANEL & AI INCIDENT AGENT ─────────────────────────────────

const ADMIN_INCIDENT_STATUSES = [
  "NEW",
  "UNDER REVIEW",
  "ASSIGNED",
  "IN PROGRESS",
  "RESOLVED",
  "WAITING FOR ADMIN VERIFICATION",
  "VERIFIED",
  "CLOSED"
];

export function AdminIncidentsPanel() {
  const [incidents, setIncidents] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiAnalysisIncident, setAiAnalysisIncident] = useState(null);
  const [aiAnalysisError, setAiAnalysisError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showTechModal, setShowTechModal] = useState(false);
  const [newTechForm, setNewTechForm] = useState({ name: "", skills: "", experience: "3 years", availability: "Available", phone: "", email: "" });

  const loadData = useCallback(() => {
    try {
      setIncidents(getIncidents().reverse());
      setTechnicians(getTechnicians());
    } catch (err) {
      toast.error("Failed to load incident data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open AI Agent modal for a specific incident
  const handleOpenAiAgent = (incident) => {
    setSelectedIncident(incident);
    const rec = recommendTechnician(incident);
    setAiRecommendation(rec);
  };

  // Assign technician to incident
  const handleAssignTechnician = (incidentId, tech) => {
    if (!tech) return toast.error("No technician selected");
    try {
      updateIncident(incidentId, {
        assigned_technician_id: tech.technician_id || tech.id,
        assigned_technician_name: tech.name,
        status: "ASSIGNED"
      });

      // Update technician availability status if currently 'Available'
      if (tech.availability === 'Available') {
        updateTechnician(tech.technician_id || tech.id, { availability: 'On-Duty' });
      }

      toast.success(`Assigned ${tech.name} to Incident #${incidentId}`);
      setSelectedIncident(null);
      setAiRecommendation(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to assign technician");
    }
  };

  // Change incident status directly
  const handleStatusChange = (incidentId, newStatus) => {
    try {
      updateIncident(incidentId, { status: newStatus });
      toast.success(`Incident #${incidentId} status set to ${newStatus}`);
      loadData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleAnalyzeIncident = (incident) => {
    try {
      const result = analyzeIncident(incident.incident_id);
      if (!result || !result.ok) {
        throw new Error(result?.message || "AI analysis failed");
      }

      setAiAnalysisIncident(result.incident || incident);
      setAiAnalysisError("");
      setSelectedIncident(null);
      setAiRecommendation(null);
      loadData();
      toast.success(`AI analysis generated for Incident #${incident.incident_id}`);
    } catch (err) {
      setAiAnalysisError("AI analysis is temporarily unavailable. You can continue managing this incident manually.");
      setAiAnalysisIncident(incident);
      toast.error(err.message || "AI analysis is temporarily unavailable.");
    }
  };

  const handleVerifyIncident = (incidentId) => {
    try {
      updateIncident(incidentId, { status: 'VERIFIED', verified_at: new Date().toISOString() });
      toast.success(`Incident #${incidentId} verified by admin`);
      loadData();
    } catch (err) {
      toast.error("Failed to verify incident");
    }
  };

  const handleCloseIncident = (incidentId) => {
    try {
      updateIncident(incidentId, { status: 'CLOSED', closed_at: new Date().toISOString() });
      toast.success(`Incident #${incidentId} closed`);
      loadData();
    } catch (err) {
      toast.error("Failed to close incident");
    }
  };

  // Delete incident
  const handleDeleteIncident = (id) => {
    if (window.confirm(`Are you sure you want to delete Incident #${id}?`)) {
      deleteIncident(id);
      toast.success(`Incident #${id} deleted`);
      loadData();
    }
  };

  // Add new technician
  const handleAddTechnician = (e) => {
    e.preventDefault();
    if (!newTechForm.name.trim()) return toast.error("Technician name is required");
    const skillList = newTechForm.skills.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      createTechnician({
        name: newTechForm.name.trim(),
        skills: skillList.length ? skillList : ["General Support"],
        experience: newTechForm.experience,
        availability: newTechForm.availability,
        phone: newTechForm.phone.trim(),
        email: newTechForm.email.trim()
      });
      toast.success("New technician added to staff roster");
      setNewTechForm({ name: "", skills: "", experience: "3 years", availability: "Available", phone: "", email: "" });
      setTechnicians(getTechnicians());
    } catch (err) {
      toast.error("Failed to add technician");
    }
  };

  const filteredIncidents = statusFilter === "ALL"
    ? incidents
    : incidents.filter((i) => i.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Incident Management & AI Agent</h1>
          <p className="text-slate-400">Monitor reported issues, run AI technician matching, and update resolution lifecycle</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTechModal(true)}
            className="btn-ghost rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 border border-purple-500/30 text-purple-300 hover:bg-purple-900/20"
          >
            <Users size={16} /> Staff Roster ({technicians.length})
          </button>
          <button onClick={loadData} className="btn-primary rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-slate-400 text-xs font-medium">Total Incidents</p>
          <p className="text-2xl font-orbitron font-bold text-white mt-1">{incidents.length}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-red-500/20 bg-red-900/10">
          <p className="text-red-300 text-xs font-medium">New / Unassigned</p>
          <p className="text-2xl font-orbitron font-bold text-red-200 mt-1">
            {incidents.filter((i) => !i.assigned_technician_name && i.status !== 'CLOSED' && i.status !== 'RESOLVED').length}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-cyan-500/20 bg-cyan-900/10">
          <p className="text-cyan-300 text-xs font-medium">Active / In Progress</p>
          <p className="text-2xl font-orbitron font-bold text-cyan-200 mt-1">
            {incidents.filter((i) => i.status === 'ASSIGNED' || i.status === 'IN PROGRESS').length}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-amber-500/20 bg-amber-900/10">
          <p className="text-amber-300 text-xs font-medium">Awaiting Verification</p>
          <p className="text-2xl font-orbitron font-bold text-amber-200 mt-1">
            {incidents.filter((i) => i.status === 'WAITING FOR ADMIN VERIFICATION').length}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-900/10">
          <p className="text-emerald-300 text-xs font-medium">Resolved / Closed</p>
          <p className="text-2xl font-orbitron font-bold text-emerald-200 mt-1">
            {incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {["ALL", ...ADMIN_INCIDENT_STATUSES].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${statusFilter === st
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
          >
            {st} {st !== "ALL" && `(${incidents.filter(i => i.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Incident List / Cards */}
      {loading && <div className="text-slate-400 text-sm">Loading incident reports...</div>}

      {!loading && filteredIncidents.length === 0 && (
        <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">
          No incidents matching status filter "{statusFilter}".
        </div>
      )}

      {!loading && filteredIncidents.map((inc) => (
        <motion.div
          key={inc.incident_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 border border-white/10 hover:border-purple-500/30 transition space-y-4"
        >
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-purple-900/40 text-purple-300 font-bold">
                  #{inc.incident_id}
                </span>
                <h2 className="text-white font-bold text-xl">{inc.title}</h2>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Reported by <span className="text-cyan-300 font-medium">{inc.user_name}</span> ({inc.user_email}) • {new Date(inc.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${inc.priority === 'CRITICAL' ? 'bg-red-900/50 text-red-300 border border-red-500/30' :
                inc.priority === 'HIGH' ? 'bg-orange-900/50 text-orange-300 border border-orange-500/30' :
                  inc.priority === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30' :
                    'bg-slate-700/50 text-slate-300'
                }`}>
                {inc.priority}
              </span>
              <select
                className="input-glass rounded-xl px-3 py-1 text-xs text-white font-medium bg-slate-900 border border-white/10"
                value={inc.status}
                onChange={(e) => handleStatusChange(inc.incident_id, e.target.value)}
              >
                {ADMIN_INCIDENT_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-400 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div>
              <span className="text-slate-500 block mb-0.5">Category</span>
              <span className="text-slate-200 font-medium">{inc.category}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Location</span>
              <span className="text-slate-200 font-medium">{inc.location}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Assigned Technician</span>
              <span className={`font-semibold ${inc.assigned_technician_name ? 'text-emerald-300' : 'text-amber-400'}`}>
                {inc.assigned_technician_name || '⚠️ Unassigned'}
              </span>
            </div>
          </div>

          <p className="text-slate-300 text-sm">{inc.description}</p>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleOpenAiAgent(inc)}
                className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-md shadow-cyan-900/30"
              >
                <Zap size={14} className="animate-bounce text-yellow-300" /> Run AI Incident Agent & Match Technician
              </button>
              <button
                onClick={() => handleAnalyzeIncident(inc)}
                className="btn-ghost rounded-xl px-4 py-2 text-xs font-semibold border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/20"
              >
                {inc.ai_analysis ? 'View AI Analysis' : 'Analyze with AI'}
              </button>
            </div>

            {inc.status === 'WAITING FOR ADMIN VERIFICATION' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleVerifyIncident(inc.incident_id)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Verify Resolution
                </button>
                <button
                  onClick={() => handleCloseIncident(inc.incident_id)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white border border-white/10"
                >
                  Close Incident
                </button>
              </div>
            )}

            {inc.status === 'VERIFIED' && (
              <button
                onClick={() => handleCloseIncident(inc.incident_id)}
                className="rounded-xl px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white border border-white/10"
              >
                Close Incident
              </button>
            )}

            <button
              onClick={() => handleDeleteIncident(inc.incident_id)}
              className="text-xs text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-900/20 transition flex items-center gap-1"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </motion.div>
      ))}

      {/* AI Incident Analysis Modal */}
      <AnimatePresence>
        {aiAnalysisIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-3xl p-6 md:p-8 border border-cyan-500/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl shadow-cyan-950/80"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-orbitron font-bold text-xl">🤖 AI Incident Analysis</h3>
                  <p className="text-cyan-300 text-xs">Operational recommendation for Incident #{aiAnalysisIncident.incident_id}</p>
                </div>
                <button
                  onClick={() => { setAiAnalysisIncident(null); setAiAnalysisError(""); }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {aiAnalysisError ? (
                <div className="bg-amber-900/20 border border-amber-500/40 text-amber-200 rounded-2xl p-4 text-sm">
                  {aiAnalysisError}
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10"><span className="text-slate-400 block text-[11px] uppercase">Category</span><span className="text-white font-semibold">{(aiAnalysisIncident.ai_analysis || aiAnalysisIncident).category}</span></div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10"><span className="text-slate-400 block text-[11px] uppercase">Severity</span><span className="text-white font-semibold">{(aiAnalysisIncident.ai_analysis || aiAnalysisIncident).severity}</span></div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10"><span className="text-slate-400 block text-[11px] uppercase">Priority</span><span className="text-white font-semibold">{(aiAnalysisIncident.ai_analysis || aiAnalysisIncident).priority}</span></div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10"><span className="text-slate-400 block text-[11px] uppercase">Risk Level</span><span className="text-white font-semibold">{(aiAnalysisIncident.ai_analysis || aiAnalysisIncident).riskLevel}</span></div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">AI Summary</p>
                    <p className="text-slate-200 text-sm leading-6">{(aiAnalysisIncident.ai_analysis || aiAnalysisIncident).summary}</p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Recommended Actions</p>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {((aiAnalysisIncident.ai_analysis || aiAnalysisIncident).recommendedActions || []).map((action, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-cyan-300">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Recommended Staff</p>
                      <p className="text-white font-semibold">{(aiAnalysisIncident.ai_analysis || aiAnalysisIncident).recommendedStaffType}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Escalation</p>
                      <p className="text-white font-semibold">{(aiAnalysisIncident.ai_analysis || aiAnalysisIncident).escalationRecommendation}</p>
                    </div>
                  </div>

                  <div className="bg-cyan-950/40 rounded-2xl p-4 border border-cyan-500/20 text-sm text-cyan-100">
                    <p className="font-semibold mb-1">Why this recommendation?</p>
                    <p>{(aiAnalysisIncident.ai_analysis || aiAnalysisIncident).explanation}</p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Incident Agent Recommendation Modal */}
      <AnimatePresence>
        {selectedIncident && aiRecommendation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-3xl p-6 md:p-8 border border-cyan-500/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl shadow-cyan-950/80"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 text-white">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-orbitron font-bold text-xl">AI Incident Agent</h3>
                    <p className="text-cyan-300 text-xs">Automated Skill & Availability Match Engine</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedIncident(null); setAiRecommendation(null); }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Target Incident Context */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-purple-300 font-mono">Incident #{selectedIncident.incident_id}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-900/40 text-red-300 font-bold">{selectedIncident.priority}</span>
                </div>
                <p className="text-white font-bold text-base">{selectedIncident.title}</p>
                <p className="text-slate-400 text-xs">Category: {selectedIncident.category} • Location: {selectedIncident.location}</p>
                <p className="text-slate-300 text-xs italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                  "{selectedIncident.description}"
                </p>
              </div>

              {/* Recommended Candidate Card */}
              {aiRecommendation.recommended ? (
                <div className="bg-gradient-to-br from-purple-900/40 via-slate-900 to-cyan-900/40 p-6 rounded-2xl border-2 border-cyan-400/50 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-cyan-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                    Top AI Recommendation ({aiRecommendation.matchScore}% Match)
                  </div>

                  <div className="flex justify-between items-start pt-2">
                    <div>
                      <h4 className="text-white font-bold text-lg">{aiRecommendation.recommended.name}</h4>
                      <p className="text-slate-300 text-xs mt-0.5">
                        📞 {aiRecommendation.recommended.phone} • ✉️ {aiRecommendation.recommended.email}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${aiRecommendation.recommended.availability === 'Available' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30' : 'bg-yellow-900/60 text-yellow-300 border border-yellow-500/30'
                      }`}>
                      {aiRecommendation.recommended.availability}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Skills & Experience</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(aiRecommendation.recommended.skills || []).map((sk) => (
                        <span key={sk} className="bg-cyan-500/20 text-cyan-200 text-xs px-2.5 py-1 rounded-lg border border-cyan-500/30">
                          {sk}
                        </span>
                      ))}
                      <span className="bg-purple-500/20 text-purple-200 text-xs px-2.5 py-1 rounded-lg border border-purple-500/30">
                        {aiRecommendation.recommended.experience} experience
                      </span>
                    </div>
                  </div>

                  <div className="bg-cyan-950/60 p-3 rounded-xl border border-cyan-500/30 text-xs text-cyan-200">
                    <p className="font-semibold mb-1 text-cyan-300">💡 AI Matching Rationale:</p>
                    <p>{aiRecommendation.matchReason}</p>
                  </div>

                  <button
                    onClick={() => handleAssignTechnician(selectedIncident.incident_id, aiRecommendation.recommended)}
                    className="w-full btn-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-900/40"
                  >
                    <CheckCircle2 size={18} /> Confirm & Assign {aiRecommendation.recommended.name}
                  </button>
                </div>
              ) : (
                <div className="text-center text-slate-400 p-6 bg-white/5 rounded-2xl">
                  No technician currently matches this criteria.
                </div>
              )}

              {/* Alternatives List */}
              {aiRecommendation.alternatives?.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Alternative Technicians</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {aiRecommendation.alternatives.map((alt) => (
                      <div
                        key={alt.technician.technician_id || alt.technician.id}
                        className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center hover:border-purple-500/30 transition text-xs"
                      >
                        <div>
                          <p className="text-white font-semibold">{alt.technician.name}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{alt.reason}</p>
                        </div>
                        <button
                          onClick={() => handleAssignTechnician(selectedIncident.incident_id, alt.technician)}
                          className="btn-ghost text-xs px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
                        >
                          Assign ({alt.score} pts)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff / Technician Roster Modal */}
      <AnimatePresence>
        {showTechModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-3xl p-6 md:p-8 border border-purple-500/30 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-white font-orbitron font-bold text-xl">Technician & Staff Roster</h3>
                  <p className="text-slate-400 text-xs">Pre-seeded technician list for AI matching engine</p>
                </div>
                <button onClick={() => setShowTechModal(false)} className="p-2 text-slate-400 hover:text-white rounded-xl">
                  <X size={20} />
                </button>
              </div>

              {/* Add Technician Form */}
              <form onSubmit={handleAddTechnician} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                <p className="text-white text-xs font-bold uppercase tracking-wider">Add New Staff Technician</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    className="input-glass rounded-xl px-3 py-2 text-xs text-white"
                    value={newTechForm.name}
                    onChange={(e) => setNewTechForm({ ...newTechForm, name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma separated) e.g. Network, Wi-Fi"
                    className="input-glass rounded-xl px-3 py-2 text-xs text-white"
                    value={newTechForm.skills}
                    onChange={(e) => setNewTechForm({ ...newTechForm, skills: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Experience e.g. 5 years"
                    className="input-glass rounded-xl px-3 py-2 text-xs text-white"
                    value={newTechForm.experience}
                    onChange={(e) => setNewTechForm({ ...newTechForm, experience: e.target.value })}
                  />
                  <select
                    className="input-glass rounded-xl px-3 py-2 text-xs text-white bg-slate-900"
                    value={newTechForm.availability}
                    onChange={(e) => setNewTechForm({ ...newTechForm, availability: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="On-Duty">On-Duty</option>
                    <option value="Busy">Busy</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="input-glass rounded-xl px-3 py-2 text-xs text-white"
                    value={newTechForm.phone}
                    onChange={(e) => setNewTechForm({ ...newTechForm, phone: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="input-glass rounded-xl px-3 py-2 text-xs text-white"
                    value={newTechForm.email}
                    onChange={(e) => setNewTechForm({ ...newTechForm, email: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary rounded-xl px-4 py-2 text-xs font-semibold">
                  + Add Technician to Roster
                </button>
              </form>

              {/* Roster Cards */}
              <div className="grid md:grid-cols-2 gap-3">
                {technicians.map((t) => (
                  <div key={t.technician_id || t.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-bold text-sm">{t.name}</p>
                        <p className="text-slate-400 text-[11px]">Experience: {t.experience}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.availability === 'Available' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-yellow-900/60 text-yellow-300'
                        }`}>
                        {t.availability}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(t.skills || []).map((sk) => (
                        <span key={sk} className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                      📞 {t.phone || 'N/A'} • ✉️ {t.email || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

