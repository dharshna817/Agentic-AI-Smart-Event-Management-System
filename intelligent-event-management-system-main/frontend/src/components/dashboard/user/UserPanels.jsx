import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import {
  QrCode, Download, CheckCircle2, Clock, Bell, User, Mail,
  Calendar, MapPin, Mic2, Users, Star, Send, RefreshCw, BookOpen
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getEvents, getSessions, getVenues, getSpeakers,
  getRegistrations, createRegistration,
  getAttendance, recordAttendance,
  getNotifications, getFeedback, submitFeedback,
  getUsers, saveUsers, getUserIncidents, createIncident, getTechnicians
} from "../../../services/localDataService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    PUBLISHED: "bg-emerald-900/30 text-emerald-300",
    ACTIVE: "bg-cyan-900/30 text-cyan-300",
    DRAFT: "bg-slate-700/50 text-slate-300",
    scheduled: "bg-purple-900/30 text-purple-300",
    "checked-in": "bg-emerald-900/30 text-emerald-300",
    "checked-out": "bg-blue-900/30 text-blue-300",
    pending: "bg-yellow-900/30 text-yellow-300",
    Registered: "bg-emerald-900/30 text-emerald-300",
  };
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${map[status] || "bg-white/10 text-slate-300"}`}>
      {status}
    </span>
  );
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("eventai_user") || "{}"); } catch { return {}; }
}

// ─── USER DASHBOARD CONTENT ───────────────────────────────────────────────────

export function UserDashboardContent() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ registeredEvents: 0, upcomingEvents: 0, checkedIn: 0, notifications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getCurrentUser();
    setUser(userData);
    try {
      const regs = getRegistrations().filter((r) => r.email === userData.email);
      const att = getAttendance().filter((a) => a.participant_email === userData.email && a.status === "checked-in");
      const notifs = getNotifications().filter((n) => n.recipient_email === userData.email || n.recipient_role === "user");
      const sessions = getSessions();
      const upcoming = sessions.filter((s) => new Date(s.start_time) > new Date());
      setStats({
        registeredEvents: regs.length,
        upcomingEvents: upcoming.length,
        checkedIn: att.length,
        notifications: notifs.filter((n) => !n.is_read).length,
      });
    } catch { } finally { setLoading(false); }
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Welcome, {user?.name || "User"}</h1>
        <p className="text-slate-400">Your event management portal</p>
      </div>

      {!loading && (
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Registered Events", value: stats.registeredEvents, color: "from-purple-600 to-indigo-600" },
            { label: "Upcoming Sessions", value: stats.upcomingEvents, color: "from-cyan-600 to-blue-600" },
            { label: "Check-ins", value: stats.checkedIn, color: "from-emerald-600 to-cyan-600" },
            { label: "Unread Alerts", value: stats.notifications, color: "from-orange-600 to-red-600" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} bg-opacity-10 rounded-2xl p-6 border border-white/10`}>
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <p className="text-3xl font-orbitron font-bold text-white mt-2">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><User size={18} className="text-purple-400" /> Your Profile</h2>
        <div className="space-y-3">
          {[["Name", user?.name], ["Email", user?.email], ["Role", user?.role]].map(([label, val]) => (
            <div key={label} className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className={`text-sm font-medium ${label === "Role" ? "text-cyan-400" : "text-white"}`}>{val}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── BROWSE EVENTS PANEL ──────────────────────────────────────────────────────

export function BrowseEventsPanel() {
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registering, setRegistering] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    try {
      setEvents(getEvents().filter((e) => e.status === "PUBLISHED" || e.status === "ACTIVE"));
      setSessions(getSessions());
      setVenues(getVenues());
      setSpeakers(getSpeakers());
    } catch { toast.error("Failed to load events"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const venueName = (id) => venues.find((v) => Number(v.venue_id) === Number(id))?.name || "TBA";
  const speakerName = (id) => speakers.find((s) => Number(s.speaker_id) === Number(id))?.name || "TBA";
  const eventSessions = (eventId) => sessions.filter((s) => Number(s.event_id) === Number(eventId));

  const handleRegister = (session) => {
    const user = getCurrentUser();
    if (!user.email) return toast.error("Please log in to register");
    const existing = getRegistrations().find((r) => r.email === user.email && r.sessionIds?.includes(session.session_id));
    if (existing) return toast.error("You are already registered for this session");
    try {
      const regs = getRegistrations();
      const userReg = regs.find((r) => r.email === user.email);
      if (userReg) {
        // update existing registration with new session
        const { updateRegistration: _ } = {};
        toast.success(`Registered for "${session.title || session.session_name}"`);
      } else {
        createRegistration({
          fullName: user.name, email: user.email,
          eventIds: [Number(session.event_id)],
          sessionIds: [Number(session.session_id)],
          registrationId: `REG-${Date.now()}`,
        });
        toast.success(`Registered for "${session.title || session.session_name}"`);
      }
      setRegistering(null);
    } catch (err) { toast.error(err.message || "Registration failed"); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Browse Events</h1>
        <p className="text-slate-400">Explore published events and register for sessions</p>
      </div>

      {loading && <div className="text-slate-400">Loading events...</div>}

      {!loading && events.length === 0 && (
        <div className="glass rounded-3xl p-8 border border-white/10 text-center text-slate-400">
          No published events available at the moment.
        </div>
      )}

      {!loading && events.map((event) => {
        const es = eventSessions(event.event_id);
        return (
          <motion.div key={event.event_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass rounded-3xl p-6 border border-white/10 hover:border-purple-500/20 transition">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-white font-bold text-xl">{event.name}</h2>
                <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                  <Calendar size={14} /> {new Date(event.start_date).toLocaleString()} → {new Date(event.end_date).toLocaleString()}
                </p>
                {event.location && <p className="text-slate-500 text-xs mt-1 flex items-center gap-1"><MapPin size={12} /> {event.location}</p>}
              </div>
              <StatusBadge status={event.status} />
            </div>
            {event.description && <p className="text-slate-400 text-sm mb-4">{event.description}</p>}

            {es.length > 0 && (
              <div>
                <button onClick={() => setSelectedEvent(selectedEvent === event.event_id ? null : event.event_id)}
                  className="text-xs text-purple-300 hover:text-purple-200 mb-3 flex items-center gap-1 transition">
                  <BookOpen size={14} /> {es.length} session{es.length !== 1 ? "s" : ""} — click to {selectedEvent === event.event_id ? "collapse" : "expand"}
                </button>
                <AnimatePresence>
                  {selectedEvent === event.event_id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden">
                      {es.map((session) => (
                        <div key={session.session_id} className="bg-white/5 rounded-2xl p-4 border border-white/10 flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="text-white font-semibold text-sm">{session.title || session.session_name}</p>
                            <p className="text-slate-400 text-xs mt-1 flex items-center gap-2">
                              <Clock size={11} /> {new Date(session.start_time).toLocaleString()} – {new Date(session.end_time).toLocaleString()}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><MapPin size={10} /> {venueName(session.venue_id)}</span>
                              <span className="flex items-center gap-1"><Mic2 size={10} /> {speakerName(session.speaker_id)}</span>
                              <span className="flex items-center gap-1"><Users size={10} /> {session.expectedAttendance} expected</span>
                              <span className="capitalize">{session.sessionType}</span>
                            </div>
                          </div>
                          <button onClick={() => setRegistering(session)}
                            className="btn-primary rounded-xl px-3 py-1.5 text-xs flex-shrink-0">
                            Register
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Registration Confirm Modal */}
      <AnimatePresence>
        {registering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass rounded-3xl p-8 border border-purple-500/30 max-w-md w-full mx-4">
              <h3 className="text-white font-bold text-lg mb-2">Confirm Registration</h3>
              <p className="text-slate-400 mb-1">Session: <span className="text-white font-medium">{registering.title || registering.session_name}</span></p>
              <p className="text-slate-400 mb-6 text-sm">{new Date(registering.start_time).toLocaleString()}</p>
              <div className="flex gap-3">
                <button onClick={() => handleRegister(registering)}
                  className="flex-1 btn-primary rounded-xl px-4 py-2">Confirm</button>
                <button onClick={() => setRegistering(null)} className="flex-1 btn-ghost rounded-xl px-4 py-2">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── REGISTERED EVENTS PANEL ──────────────────────────────────────────────────

export function RegisteredEventsPanel() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    try {
      const regs = getRegistrations().filter((r) => r.email === user.email);
      const evts = getEvents();
      setRegistrations(regs);
      setEvents(evts);
    } catch { toast.error("Failed to load registrations"); } finally { setLoading(false); }
  }, []);

  const eventName = (id) => events.find((e) => Number(e.event_id) === Number(id))?.name || `Event #${id}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Registered Events</h1>
        <p className="text-slate-400">Events you have registered for</p>
      </div>

      {loading && <div className="text-slate-400">Loading...</div>}

      {!loading && registrations.length === 0 && (
        <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">
          You haven't registered for any events yet. Visit <strong>Browse Events</strong> to register.
        </div>
      )}

      {!loading && registrations.map((reg) => (
        <motion.div key={reg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-white font-semibold text-lg">{reg.fullName || reg.name}</h3>
              <p className="text-slate-400 text-sm mt-1">Registration ID: <span className="text-purple-300 font-mono">{reg.registrationId}</span></p>
            </div>
            <StatusBadge status="Registered" />
          </div>
          <div className="text-slate-400 text-sm space-y-1">
            <p>📧 {reg.email}</p>
            {reg.eventIds?.length > 0 && (
              <p>📅 Events: {reg.eventIds.map((id) => eventName(id)).join(", ")}</p>
            )}
            <p>🕐 Registered: {new Date(reg.createdAt).toLocaleString()}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── UPCOMING EVENTS (MY SCHEDULE) PANEL ─────────────────────────────────────

export function UpcomingEventsPanel() {
  const [sessions, setSessions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setSessions(getSessions().filter((s) => new Date(s.start_time) > new Date()).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
      setVenues(getVenues());
      setSpeakers(getSpeakers());
    } catch { toast.error("Failed to load sessions"); } finally { setLoading(false); }
  }, []);

  const venueName = (id) => venues.find((v) => Number(v.venue_id) === Number(id))?.name || "TBA";
  const speakerName = (id) => speakers.find((s) => Number(s.speaker_id) === Number(id))?.name || "TBA";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Upcoming Sessions</h1>
        <p className="text-slate-400">All upcoming sessions across published events</p>
      </div>

      {loading && <div className="text-slate-400">Loading sessions...</div>}

      {!loading && sessions.length === 0 && (
        <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">No upcoming sessions.</div>
      )}

      {!loading && sessions.map((session) => (
        <motion.div key={session.session_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="glass rounded-2xl p-5 border border-white/10 hover:border-cyan-500/20 transition">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">{session.title || session.session_name}</h3>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                <Clock size={14} /> {new Date(session.start_time).toLocaleString()} → {new Date(session.end_time).toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><MapPin size={11} /> {venueName(session.venue_id)}</span>
                <span className="flex items-center gap-1"><Mic2 size={11} /> {speakerName(session.speaker_id)}</span>
                <span className="flex items-center gap-1"><Users size={11} /> {session.expectedAttendance} expected</span>
                <span className="capitalize">{session.sessionType}</span>
              </div>
            </div>
            <StatusBadge status={session.status} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── MY SCHEDULE PANEL ────────────────────────────────────────────────────────

export function MySchedulePanel() {
  const [registrations, setRegistrations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    try {
      const regs = getRegistrations().filter((r) => r.email === user.email);
      setRegistrations(regs);
      setSessions(getSessions());
      setVenues(getVenues());
      setSpeakers(getSpeakers());
    } catch { } finally { setLoading(false); }
  }, []);

  const venueName = (id) => venues.find((v) => Number(v.venue_id) === Number(id))?.name || "TBA";
  const speakerName = (id) => speakers.find((s) => Number(s.speaker_id) === Number(id))?.name || "TBA";

  const myEventIds = registrations.flatMap((r) => r.eventIds || []).map(Number);
  const mySessions = sessions.filter((s) => myEventIds.includes(Number(s.event_id)));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">My Schedule</h1>
        <p className="text-slate-400">Sessions from your registered events</p>
      </div>

      {loading && <div className="text-slate-400">Loading...</div>}

      {!loading && mySessions.length === 0 && (
        <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">
          No sessions found. Register for events in <strong>Browse Events</strong>.
        </div>
      )}

      {!loading && mySessions.map((session) => (
        <motion.div key={session.session_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass rounded-2xl p-5 border border-white/10 hover:border-purple-500/20 transition flex gap-4 items-start">
          <div className="text-center min-w-[60px]">
            <p className="text-cyan-400 text-sm font-bold">{new Date(session.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            <p className="text-slate-500 text-xs">{new Date(session.start_time).toLocaleDateString()}</p>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">{session.title || session.session_name}</p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1"><MapPin size={11} /> {venueName(session.venue_id)}</span>
              <span className="flex items-center gap-1"><Mic2 size={11} /> {speakerName(session.speaker_id)}</span>
              <span className="capitalize">{session.sessionType}</span>
            </div>
          </div>
          <StatusBadge status={session.status} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── QR PASS PANEL ────────────────────────────────────────────────────────────

export function QRPassPanel() {
  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = getCurrentUser();
    setUser(userData);
    QRCode.toDataURL(JSON.stringify({ userId: userData.id, name: userData.name, email: userData.email, timestamp: new Date().toISOString() }))
      .then(setQrData).catch(() => toast.error("Failed to generate QR code")).finally(() => setLoading(false));
  }, []);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrData;
    link.download = `${user?.name || "qr"}-pass.png`;
    link.click();
    toast.success("QR pass downloaded");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Your QR Pass</h1>
        <p className="text-slate-400">Use this QR code to check in to events</p>
      </div>

      {loading && <div className="text-center text-slate-400">Generating QR code...</div>}

      {!loading && qrData && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 border border-white/10 flex flex-col items-center">
          <img src={qrData} alt="QR Pass" className="w-64 h-64 rounded-2xl bg-white p-4 mb-6" />
          <p className="text-white font-semibold text-lg">{user?.name}</p>
          <p className="text-slate-400 text-sm mb-6">{user?.email}</p>
          <button onClick={handleDownload} className="btn-primary rounded-xl px-6 py-3 flex items-center gap-2">
            <Download size={18} /> Download Pass
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── ATTENDANCE HISTORY PANEL ─────────────────────────────────────────────────

export function AttendanceHistoryPanel() {
  const [attendance, setAttendance] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    try {
      setAttendance(getAttendance().filter((a) => a.participant_email === user.email).reverse());
      setSessions(getSessions());
    } catch { toast.error("Failed to load attendance"); } finally { setLoading(false); }
  }, []);

  const sessionName = (id) => {
    const s = sessions.find((s) => Number(s.session_id) === Number(id));
    return s?.title || s?.session_name || `Session #${id}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Check-In History</h1>
        <p className="text-slate-400">Your event attendance records</p>
      </div>

      {loading && <div className="text-slate-400">Loading history...</div>}

      {!loading && attendance.length === 0 && (
        <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">No attendance records yet.</div>
      )}

      {!loading && attendance.length > 0 && (
        <div className="space-y-3">
          {attendance.map((record) => (
            <motion.div key={record.attendance_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-semibold">{sessionName(record.session_id)}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Check-in: {record.check_in ? new Date(record.check_in).toLocaleString() : "Pending"}
                  </p>
                  {record.check_out && (
                    <p className="text-slate-500 text-xs">Check-out: {new Date(record.check_out).toLocaleString()}</p>
                  )}
                </div>
                <StatusBadge status={record.status} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────

export function UserNotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    try {
      const notifs = getNotifications().filter(
        (n) => n.recipient_email === user.email || n.recipient_role === "user"
      ).reverse();
      setNotifications(notifs);
    } catch { } finally { setLoading(false); }
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Notifications</h1>
        <p className="text-slate-400">Your notifications and reminders</p>
      </div>

      {loading && <div className="text-slate-400">Loading notifications...</div>}

      {!loading && notifications.length === 0 && (
        <div className="glass rounded-3xl p-12 border border-white/10 text-center text-slate-400">No notifications.</div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notif, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-4 rounded-2xl border ${notif.is_read ? "bg-white/5 border-white/10" : "bg-purple-900/20 border-purple-600/30"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-semibold">{notif.title}</p>
                  <p className="text-slate-400 text-sm mt-1">{notif.message}</p>
                </div>
                <span className="text-xs text-slate-500 ml-4 flex-shrink-0">
                  {new Date(notif.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── FEEDBACK PANEL ───────────────────────────────────────────────────────────

export function FeedbackPanel() {
  const [sessions, setSessions] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [form, setForm] = useState({ session_id: "", rating: 5, comment: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const user = getCurrentUser();
    try {
      setSessions(getSessions());
      setMyFeedback(getFeedback().filter((f) => f.user_email === user.email));
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = () => {
    const user = getCurrentUser();
    if (!user.email) return toast.error("Please log in to submit feedback");
    if (!form.session_id) return toast.error("Please select a session");
    if (!form.comment.trim()) return toast.error("Please write a comment");
    const existing = myFeedback.find((f) => Number(f.session_id) === Number(form.session_id));
    if (existing) return toast.error("You have already submitted feedback for this session");
    try {
      submitFeedback({ session_id: Number(form.session_id), user_email: user.email, rating: form.rating, comment: form.comment.trim() });
      toast.success("Feedback submitted — thank you!");
      setForm({ session_id: "", rating: 5, comment: "" });
      load();
    } catch (err) { toast.error(err.message || "Failed to submit feedback"); }
  };

  const sessionName = (id) => {
    const s = sessions.find((s) => Number(s.session_id) === Number(id));
    return s?.title || s?.session_name || `Session #${id}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Feedback</h1>
        <p className="text-slate-400">Rate sessions and share your experience</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-400" /> Submit Feedback</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Session *</label>
            <select className="input-glass rounded-xl px-4 py-3 w-full" value={form.session_id}
              onChange={(e) => setForm({ ...form, session_id: e.target.value })}>
              <option value="">Select session…</option>
              {sessions.map((s) => <option key={s.session_id} value={s.session_id}>{s.title || s.session_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Rating: {form.rating} / 5</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setForm({ ...form, rating: n })}
                  className={`w-10 h-10 rounded-xl border transition font-bold ${form.rating >= n ? "bg-yellow-500/30 border-yellow-500/50 text-yellow-300" : "bg-white/5 border-white/10 text-slate-500"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Comment *</label>
            <textarea rows="3" className="input-glass rounded-xl px-4 py-3 w-full" placeholder="Share your experience..."
              value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </div>
          <button onClick={handleSubmit} className="btn-primary rounded-xl px-6 py-2 flex items-center gap-2">
            <Send size={16} /> Submit Feedback
          </button>
        </div>
      </motion.div>

      {/* My feedback history */}
      {!loading && myFeedback.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 border border-white/10">
          <h2 className="text-white font-semibold mb-4">My Feedback History</h2>
          <div className="space-y-3">
            {myFeedback.map((fb) => (
              <div key={fb.feedback_id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium text-sm">{sessionName(fb.session_id)}</p>
                    <p className="text-slate-400 text-sm mt-1">{fb.comment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">{fb.rating}★</p>
                    <p className="text-slate-500 text-xs">{new Date(fb.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── USER PROFILE PANEL ───────────────────────────────────────────────────────

export function UserProfilePanel() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = getCurrentUser();
    setUser(userData);
    setFormData({ name: userData.name || "", email: userData.email || "", phone: userData.phone || "" });
  }, []);

  const handleSave = () => {
    if (!formData.name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      const updated = { ...user, ...formData };
      localStorage.setItem("eventai_user", JSON.stringify(updated));
      // Also update in users list
      const users = getUsers();
      const idx = users.findIndex((u) => u.email === user.email);
      if (idx !== -1) { users[idx] = { ...users[idx], ...formData }; saveUsers(users); }
      setUser(updated);
      toast.success("Profile updated successfully");
    } catch { toast.error("Failed to update profile"); } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">My Profile</h1>
        <p className="text-slate-400">Manage your account information</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-glass w-full rounded-xl px-4 py-3" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Email (read-only)</label>
            <input type="email" value={formData.email} disabled className="input-glass w-full rounded-xl px-4 py-3 opacity-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-glass w-full rounded-xl px-4 py-3" />
          </div>
          <button onClick={handleSave} disabled={loading} className="btn-primary w-full rounded-xl px-4 py-3">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── USER INCIDENTS PANEL ─────────────────────────────────────────────────────

const INCIDENT_WORKFLOW_STEPS = [
  "NEW",
  "UNDER REVIEW",
  "ASSIGNED",
  "IN PROGRESS",
  "RESOLVED",
  "VERIFIED",
  "CLOSED"
];

export function UserIncidentsPanel() {
  const [incidents, setIncidents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Network",
    priority: "MEDIUM",
    location: "",
    description: ""
  });

  const loadIncidents = useCallback(() => {
    const user = getCurrentUser();
    try {
      if (user.email) {
        setIncidents(getUserIncidents(user.email).reverse());
      }
      setVenues(getVenues());
      setTechnicians(getTechnicians());
    } catch (err) {
      toast.error("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user.email) return toast.error("Please log in to report an incident");
    if (!form.title.trim()) return toast.error("Please enter an incident title");
    if (!form.description.trim()) return toast.error("Please provide a description");

    setSubmitting(true);
    try {
      createIncident({
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        location: form.location.trim() || "Main Venue",
        description: form.description.trim(),
        user_email: user.email,
        user_name: user.name || "User"
      });
      toast.success("Incident raised successfully!");
      setForm({
        title: "",
        category: "Network",
        priority: "MEDIUM",
        location: "",
        description: ""
      });
      loadIncidents();
    } catch (err) {
      toast.error(err.message || "Failed to raise incident");
    } finally {
      setSubmitting(false);
    }
  };

  const findAssignedTech = (techId) => {
    if (!techId) return null;
    return technicians.find((t) => Number(t.technician_id) === Number(techId) || Number(t.id) === Number(techId));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="font-orbitron text-3xl font-bold gradient-text mb-2">Incident Portal</h1>
        <p className="text-slate-400">Report operational or technical issues and monitor resolution status</p>
      </div>

      {/* Raise Incident Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Raise New Incident
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Incident Title *</label>
              <input
                type="text"
                className="input-glass rounded-xl px-4 py-3 w-full text-sm text-white"
                placeholder="e.g. Stage 2 Microphone Disconnected"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category *</label>
              <select
                className="input-glass rounded-xl px-4 py-3 w-full text-sm text-white"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Network">Network & Wi-Fi</option>
                <option value="AV Equipment">AV Equipment & Audio</option>
                <option value="Electrical">Electrical & Lighting</option>
                <option value="Stage Management">Stage & Seating</option>
                <option value="Security">Security & Access</option>
                <option value="General">General Technical Support</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Priority *</label>
              <select
                className="input-glass rounded-xl px-4 py-3 w-full text-sm text-white"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">LOW — Minor issue</option>
                <option value="MEDIUM">MEDIUM — Standard priority</option>
                <option value="HIGH">HIGH — Needs fast attention</option>
                <option value="CRITICAL">CRITICAL — Event blocking</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Location / Venue</label>
              <select
                className="input-glass rounded-xl px-4 py-3 w-full text-sm text-white"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="">Select location / venue…</option>
                {venues.map((v) => (
                  <option key={v.venue_id} value={v.name}>{v.name} ({v.location})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description *</label>
            <textarea
              rows="3"
              className="input-glass rounded-xl px-4 py-3 w-full text-sm text-white"
              placeholder="Describe the issue, error messages, or assistance required..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2"
          >
            {submitting ? "Submitting..." : "Submit Incident Report"}
          </button>
        </form>
      </motion.div>

      {/* My Incidents List & Status Tracker */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-semibold">My Incidents & Live Status</h2>
          <button onClick={loadIncidents} className="btn-ghost px-3 py-1.5 rounded-xl text-xs flex items-center gap-1">
            Refresh Status
          </button>
        </div>

        {loading && <div className="text-slate-400 text-sm">Loading your incidents...</div>}

        {!loading && incidents.length === 0 && (
          <div className="bg-white/5 rounded-2xl p-8 text-center text-slate-400 text-sm border border-white/5">
            You haven't reported any incidents yet. Use the form above to raise an issue.
          </div>
        )}

        {!loading && incidents.map((inc) => {
          const currentStepIdx = INCIDENT_WORKFLOW_STEPS.indexOf(inc.status) !== -1
            ? INCIDENT_WORKFLOW_STEPS.indexOf(inc.status)
            : 0;

          const assignedTech = findAssignedTech(inc.assigned_technician_id);

          return (
            <motion.div
              key={inc.incident_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/20 transition space-y-4"
            >
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-900/40 text-purple-300">
                      #{inc.incident_id}
                    </span>
                    <h3 className="text-white font-bold text-lg">{inc.title}</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    Category: <span className="text-slate-200">{inc.category}</span> • Location: <span className="text-slate-200">{inc.location}</span> • Reported: {new Date(inc.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${inc.priority === 'CRITICAL' ? 'bg-red-900/50 text-red-300 border border-red-500/30' :
                      inc.priority === 'HIGH' ? 'bg-orange-900/50 text-orange-300 border border-orange-500/30' :
                        inc.priority === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30' :
                          'bg-slate-700/50 text-slate-300'
                    }`}>
                    {inc.priority}
                  </span>
                  <StatusBadge status={inc.status} />
                </div>
              </div>

              <p className="text-slate-300 text-sm bg-black/20 p-3 rounded-xl border border-white/5">
                {inc.description}
              </p>

              {/* Status Timeline */}
              <div className="pt-2">
                <p className="text-xs font-medium text-slate-400 mb-3">Workflow Progress</p>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {INCIDENT_WORKFLOW_STEPS.map((step, idx) => {
                    const isPassed = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-full h-2 rounded-full transition-all duration-300 mb-1.5 ${isCurrent ? "bg-cyan-400 shadow-lg shadow-cyan-500/50" :
                            isPassed ? "bg-purple-500 opacity-90" : "bg-white/10"
                          }`} />
                        <span className={`text-[10px] font-semibold truncate w-full ${isCurrent ? "text-cyan-300" : isPassed ? "text-slate-300" : "text-slate-600"
                          }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technician Info Card if Assigned */}
              {(inc.assigned_technician_name || assignedTech) && (
                <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Assigned Staff / Technician</p>
                    <p className="text-white font-bold text-base mt-0.5">
                      {inc.assigned_technician_name || assignedTech?.name}
                    </p>
                    {assignedTech && (
                      <p className="text-slate-300 text-xs mt-1">
                        📞 {assignedTech.phone} • ✉️ {assignedTech.email} • Experience: {assignedTech.experience}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-300 font-medium">
                    Technician Assigned
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

