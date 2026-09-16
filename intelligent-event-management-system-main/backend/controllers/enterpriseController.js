const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const cron = require("node-cron");
const crypto = require("crypto");
const {
  readEntity,
  writeEntity,
  withWriteLock,
  nextId,
} = require("../lib/jsonStore");
const { buildConflictMessage } = require("../lib/validation");

const memory = {
  users: readEntity("users", []),
  venues: readEntity("venues", []),
  bookings: readEntity("bookings", []),
  speakers: readEntity("speakers", []),
  sessions: readEntity("sessions", []),
  attendance: readEntity("attendance", []),
  notifications: readEntity("notifications", []),
  qrRecords: [],
};

const ensureUserAuthData = (role, email, password, name) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const users = readEntity("users", []);
  const match = users.find(
    (user) =>
      String(user.email || "")
        .trim()
        .toLowerCase() === normalizedEmail,
  );

  if (match) return match;

  const user = {
    id: nextId(users),
    name: name || "User",
    email: normalizedEmail,
    password: hashPassword(password || "changeme"),
    role,
    created_at: new Date().toISOString(),
  };

  users.push(user);
  writeEntity("users", users);
  return user;
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(String(password), salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function comparePassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  if (!storedHash.includes(":")) return String(password) === storedHash;
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derived = crypto
    .pbkdf2Sync(String(password), salt, 100000, 64, "sha512")
    .toString("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(derived, "hex"),
    );
  } catch (error) {
    return false;
  }
}

function isStrongPassword(password) {
  const value = String(password || "");
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
}

function makeQrToken() {
  return `QR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "your-email@example.com",
      pass: process.env.SMTP_PASS || "your-password",
    },
  });
}

async function sendReminderEmail(email, name) {
  const transporter = createTransporter();
  const message = {
    from: process.env.SMTP_FROM || "EventAI <no-reply@eventai.local>",
    to: email,
    subject: "Event reminder: One week left",
    html: `<p>Hello ${name},</p><p>This is a reminder that your event is scheduled one week from now. Please check your dashboard for your QR pass and venue updates.</p>`,
  };

  try {
    await transporter.sendMail(message);
    return true;
  } catch (error) {
    console.warn("Reminder email failed:", error.message);
    return false;
  }
}

cron.schedule("0 9 * * *", async () => {
  const users = readEntity("users", []);
  for (const participant of users.filter((user) => user.role === "user")) {
    await sendReminderEmail(participant.email, participant.name);
  }
});

async function registerUser(req, res) {
  const { name, email, password, role = "user" } = req.body || {};
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!name || !normalizedEmail || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, password are required" });
  }

  if (!isStrongPassword(password)) {
    return res
      .status(400)
      .json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
  }

  const users = readEntity("users", []);
  const existing = users.find(
    (user) =>
      String(user.email || "")
        .trim()
        .toLowerCase() === normalizedEmail,
  );
  if (existing) {
    return res
      .status(409)
      .json({ message: "An account with this email already exists" });
  }

  const user = {
    id: nextId(users),
    name,
    email: normalizedEmail,
    password: hashPassword(password),
    role,
    created_at: new Date().toISOString(),
  };

  users.push(user);
  writeEntity("users", users);
  return res
    .status(201)
    .json({
      success: true,
      user: { id: user.id, name, email: normalizedEmail, role },
    });
}

async function loginUser(req, res) {
  const { email, password, role } = req.body || {};
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const users = readEntity("users", []);
  const match = users.find(
    (user) =>
      String(user.email || "")
        .trim()
        .toLowerCase() === normalizedEmail &&
      (!role || user.role === role),
  );

  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = comparePassword(password, match.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  if (!String(match.password || "").includes(":")) {
    const idx = users.findIndex((user) => Number(user.id) === Number(match.id));
    if (idx >= 0) {
      users[idx].password = hashPassword(password);
      writeEntity("users", users);
    }
  }

  return res.json({
    success: true,
    user: {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
    },
  });
}

async function getVenues(req, res) {
  const venues = readEntity("venues", []);
  return res.json(venues);
}

async function recommendVenue(req, res) {
  const attendees = Number(req.query.attendees || 0);
  const preferredDate = req.query.date || new Date().toISOString().slice(0, 10);
  const venues = readEntity("venues", []);
  const bookings = readEntity("bookings", []);

  const options = venues
    .map((venue) => {
      const overlapping = bookings.filter(
        (booking) =>
          Number(booking.venue_id) === Number(venue.venue_id) &&
          booking.status === "confirmed" &&
          new Date(booking.start_time).toISOString().slice(0, 10) ===
            preferredDate,
      );
      const available = overlapping.length === 0;
      const utilization = venue.capacity
        ? Math.min(100, Math.round((attendees / venue.capacity) * 100))
        : 0;
      const recommendationScore = available
        ? 100 - Math.abs(attendees - Number(venue.capacity || 0)) / 10
        : 0;
      return { ...venue, available, utilization, recommendationScore };
    })
    .filter((venue) => venue.available)
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  const best = options[0] || {
    ...venues[0],
    available: false,
    alternative: true,
  };
  const alternatives = options.slice(1, 4);

  return res.json({
    best,
    alternatives,
    suggestion:
      attendees > Number(best.capacity || 0)
        ? "Room upgrade recommended"
        : "Venue utilization is within target range",
    utilizationSummary: {
      attendeeCount: attendees,
      recommendedCapacity: Number(best.capacity || 0),
      utilization: best.capacity
        ? Math.min(100, Math.round((attendees / best.capacity) * 100))
        : 0,
    },
  });
}

async function createVenueBooking(req, res) {
  const { venue_id, event_name, attendee_count, start_time, end_time } =
    req.body || {};
  const venues = readEntity("venues", []);
  const bookings = readEntity("bookings", []);
  const venue = venues.find(
    (item) => Number(item.venue_id) === Number(venue_id),
  );

  if (!venue) return res.status(404).json({ message: "Venue not found" });
  if (Number(attendee_count) > Number(venue.capacity))
    return res
      .status(400)
      .json({
        message:
          "Attendee count exceeds venue capacity. Consider upgrade or alternate venue.",
      });

  await withWriteLock("bookings", async () => {
    const current = readEntity("bookings", []);
    const conflict = current.find(
      (booking) =>
        Number(booking.venue_id) === Number(venue_id) &&
        booking.status === "confirmed" &&
        new Date(booking.start_time) < new Date(end_time) &&
        new Date(booking.end_time) > new Date(start_time),
    );
    if (conflict) {
      return res
        .status(409)
        .json({
          message: buildConflictMessage(
            "Venue",
            venue.name,
            conflict.start_time,
            conflict.end_time,
          ),
        });
    }

    const booking = {
      booking_id: nextId(current, "booking_id"),
      venue_id: Number(venue_id),
      event_name,
      attendee_count,
      start_time,
      end_time,
      status: "confirmed",
      created_at: new Date().toISOString(),
    };
    current.push(booking);
    writeEntity("bookings", current);
    return res.status(201).json({ success: true, booking });
  });
}

async function getSpeakers(req, res) {
  return res.json(readEntity("speakers", []));
}

async function createSpeakerSession(req, res) {
  const { speaker_id, session_name, start_time, end_time } = req.body || {};
  const speakers = readEntity("speakers", []);
  const sessions = readEntity("sessions", []);
  const speaker = speakers.find(
    (item) => Number(item.speaker_id) === Number(speaker_id),
  );

  if (!speaker) return res.status(404).json({ message: "Speaker not found" });

  await withWriteLock("sessions", async () => {
    const currentSessions = readEntity("sessions", []);
    const conflict = currentSessions.find(
      (session) =>
        Number(session.speaker_id) === Number(speaker_id) &&
        session.status !== "cancelled" &&
        new Date(session.start_time) < new Date(end_time) &&
        new Date(session.end_time) > new Date(start_time),
    );
    if (conflict) {
      return res
        .status(409)
        .json({
          message: buildConflictMessage(
            "Speaker",
            speaker.name,
            conflict.start_time,
            conflict.end_time,
          ),
        });
    }

    const session = {
      session_id: nextId(currentSessions, "session_id"),
      speaker_id: Number(speaker_id),
      session_name,
      start_time,
      end_time,
      status: "scheduled",
      created_at: new Date().toISOString(),
    };
    currentSessions.push(session);
    writeEntity("sessions", currentSessions);
    return res.status(201).json({ success: true, session });
  });
}

async function getSessions(req, res) {
  return res.json(readEntity("sessions", []));
}

async function getAnalytics(req, res) {
  const venues = readEntity("venues", []);
  const speakers = readEntity("speakers", []);
  const sessions = readEntity("sessions", []);
  const attendance = readEntity("attendance", []);
  const registrations = readEntity("registrations", []);
  const bookings = readEntity("bookings", []);

  const venueUtilization = venues.map((venue) => {
    const totalHours = bookings
      .filter(
        (booking) =>
          Number(booking.venue_id) === Number(venue.venue_id) &&
          booking.status === "confirmed",
      )
      .reduce((sum, booking) => {
        const durationHours =
          (new Date(booking.end_time) - new Date(booking.start_time)) / 3600000;
        return sum + durationHours;
      }, 0);
    const utilization = venue.capacity
      ? Number(((totalHours / (Number(venue.capacity) * 24)) * 100).toFixed(1))
      : 0;
    return {
      label: venue.name,
      capacity: Number(venue.capacity || 0),
      filled: Math.min(
        Number(venue.capacity || 0),
        Math.round(Number(venue.capacity || 0) * 0.72),
      ),
      utilization,
    };
  });

  const speakerUtilization = speakers.map((speaker) => ({
    label: speaker.name,
    sessions:
      sessions.filter(
        (session) => Number(session.speaker_id) === Number(speaker.speaker_id),
      ).length || 1,
  }));

  const attendanceTrend = [
    {
      label: "Week 1",
      value:
        attendance.filter(
          (entry) =>
            new Date(entry.created_at) < new Date(Date.now() - 21 * 86400000),
        ).length || 0,
    },
    {
      label: "Week 2",
      value:
        attendance.filter(
          (entry) =>
            new Date(entry.created_at) >=
              new Date(Date.now() - 21 * 86400000) &&
            new Date(entry.created_at) < new Date(Date.now() - 14 * 86400000),
        ).length || 0,
    },
    {
      label: "Week 3",
      value:
        attendance.filter(
          (entry) =>
            new Date(entry.created_at) >=
              new Date(Date.now() - 14 * 86400000) &&
            new Date(entry.created_at) < new Date(Date.now() - 7 * 86400000),
        ).length || 0,
    },
    {
      label: "Week 4",
      value:
        attendance.filter(
          (entry) =>
            new Date(entry.created_at) >= new Date(Date.now() - 7 * 86400000),
        ).length || 0,
    },
  ];

  const registrationTrend = [
    {
      label: "Mon",
      value: registrations.filter(
        (entry) => new Date(entry.createdAt).getDay() === 1,
      ).length,
    },
    {
      label: "Tue",
      value: registrations.filter(
        (entry) => new Date(entry.createdAt).getDay() === 2,
      ).length,
    },
    {
      label: "Wed",
      value: registrations.filter(
        (entry) => new Date(entry.createdAt).getDay() === 3,
      ).length,
    },
    {
      label: "Thu",
      value: registrations.filter(
        (entry) => new Date(entry.createdAt).getDay() === 4,
      ).length,
    },
    {
      label: "Fri",
      value: registrations.filter(
        (entry) => new Date(entry.createdAt).getDay() === 5,
      ).length,
    },
  ];

  return res.json({
    venueUtilization,
    speakerUtilization,
    attendance: attendanceTrend,
    registrationTrend,
    overview: {
      totalVenues: venues.length,
      totalSpeakers: speakers.length,
      sessionsScheduled: sessions.length,
      checkins: attendance.length,
      utilizationScore: venueUtilization.length
        ? Number(
            (
              venueUtilization.reduce(
                (sum, item) => sum + item.utilization,
                0,
              ) / venueUtilization.length
            ).toFixed(1),
          )
        : 0,
    },
  });
}

async function getNotifications(req, res) {
  const { role } = req.query;
  const notifications = readEntity("notifications", []);
  const filter = role
    ? notifications.filter(
        (note) => note.recipient_role === role || note.role === role,
      )
    : notifications;
  return res.json(filter);
}

async function createNotification(req, res) {
  const {
    recipient,
    role = "user",
    title,
    message,
    type = "info",
  } = req.body || {};
  const notifications = readEntity("notifications", []);
  const note = {
    id: nextId(notifications),
    recipient_email: recipient || "",
    recipient_role: role,
    title,
    message,
    type,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  notifications.unshift(note);
  writeEntity("notifications", notifications);
  return res.status(201).json({ success: true, notification: note });
}

async function scanAttendance(req, res) {
  const { qrToken } = req.body || {};
  const attendance = readEntity("attendance", []);
  const record = attendance.find((item) => item.qrToken === qrToken);

  if (!record) {
    return res
      .status(404)
      .json({ message: "QR code not found or already invalid." });
  }

  const participation = attendance.find((item) => item.qrToken === qrToken);
  if (!participation) {
    const checkedIn = {
      id: nextId(attendance),
      registration_id: record.registrationId,
      full_name: record.fullName,
      email: record.email,
      qrToken,
      check_in_at: new Date().toISOString(),
      status: "checked-in",
      created_at: new Date().toISOString(),
    };
    attendance.push(checkedIn);
    writeEntity("attendance", attendance);
    return res.json({
      status: "checked-in",
      message: "Check-in successful.",
      attendee: checkedIn,
    });
  }

  if (participation.status === "checked-in" && !participation.check_out_at) {
    participation.check_out_at = new Date().toISOString();
    participation.status = "checked-out";
    writeEntity("attendance", attendance);
    return res.json({
      status: "checked-out",
      message: "Check-out successful.",
      attendee: participation,
    });
  }

  return res
    .status(409)
    .json({ message: "This QR token has already been processed." });
}

async function getQrPass(req, res) {
  const { email } = req.query || {};
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const registrations = readEntity("registrations", []);
  const pass = registrations.find(
    (record) =>
      record.email &&
      String(record.email).trim().toLowerCase() === normalizedEmail,
  );

  if (!pass) {
    return res
      .status(404)
      .json({ message: "QR pass not found for this participant." });
  }

  const qrToken = pass.qrToken || makeQrToken();
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      registrationId: pass.registrationId,
      email: pass.email,
      qrToken,
    }),
  );

  return res.json({
    fullName: pass.fullName,
    email: pass.email,
    registrationId: pass.registrationId,
    qrToken,
    qrDataUrl,
    event: "TechFest 2025",
  });
}

module.exports = {
  registerUser,
  loginUser,
  getVenues,
  recommendVenue,
  createVenueBooking,
  getSpeakers,
  createSpeakerSession,
  getSessions,
  getAnalytics,
  getNotifications,
  createNotification,
  scanAttendance,
  getQrPass,
  sendReminderEmail,
  upsertParticipantQr: async function () {},
  ensureUserAuthData,
  makeQrToken,
  memory,
};
