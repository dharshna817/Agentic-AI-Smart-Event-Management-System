const STORAGE_KEYS = {
  events: 'events',
  venues: 'venues',
  speakers: 'speakers',
  sessions: 'sessions',
  venueBookings: 'venueBookings',
  speakerAssignments: 'speakerAssignments',
  attendance: 'attendance',
  feedback: 'feedback',
  registrations: 'registrations',
  notifications: 'notifications',
  users: 'users',
  incidents: 'incidents',
  technicians: 'technicians',
};

const SAMPLE_EVENTS = [
  {
    id: 1,
    event_id: 1,
    name: 'AI Tech Summit',
    description: 'A flagship conference on responsible AI and enterprise transformation.',
    location: 'Grand Auditorium',
    start_date: '2026-08-20T09:00:00',
    end_date: '2026-08-20T17:00:00',
    status: 'PUBLISHED',
  },
  {
    id: 2,
    event_id: 2,
    name: 'Women in AI Forum',
    description: 'Leadership, research, and product strategies for women in AI.',
    location: 'Innovation Hall',
    start_date: '2026-08-21T10:00:00',
    end_date: '2026-08-21T15:30:00',
    status: 'PUBLISHED',
  },
  {
    id: 3,
    event_id: 3,
    name: 'Smart Cities Expo',
    description: 'Urban technology, mobility, and civic infrastructure showcase.',
    location: 'Summit Lab',
    start_date: '2026-08-22T09:30:00',
    end_date: '2026-08-22T18:00:00',
    status: 'DRAFT',
  },
  {
    id: 4,
    event_id: 4,
    name: 'Startup Growth Forum',
    description: 'Founder stories, investor connections, and scaling strategies for emerging startups.',
    location: 'Innovation Hub',
    start_date: '2026-08-27T10:00:00',
    end_date: '2026-08-27T16:00:00',
    status: 'PUBLISHED',
  },
  {
    id: 5,
    event_id: 5,
    name: 'Healthcare AI Connect',
    description: 'Digital health, diagnostics, and AI-led care transformation for healthcare leaders.',
    location: 'Medical Pavilion',
    start_date: '2026-08-28T09:00:00',
    end_date: '2026-08-28T17:00:00',
    status: 'PUBLISHED',
  },
  {
    id: 6,
    event_id: 6,
    name: 'Future Mobility Expo',
    description: 'EV technology, autonomous systems, and smart transportation innovations.',
    location: 'Tech Arena',
    start_date: '2026-08-30T09:30:00',
    end_date: '2026-08-30T18:30:00',
    status: 'PUBLISHED',
  },
  {
    id: 7,
    event_id: 7,
    name: 'Cybersecurity Leaders Summit',
    description: 'Security strategies, zero-trust architecture, and resilience planning for modern enterprises.',
    location: 'Secure Hall',
    start_date: '2026-08-31T11:00:00',
    end_date: '2026-08-31T18:00:00',
    status: 'PUBLISHED',
  },
  {
    id: 8,
    event_id: 8,
    name: 'Green Tech Innovation Week',
    description: 'Clean energy, sustainability, and climate tech discussions with industry leaders.',
    location: 'Sustainability Center',
    start_date: '2026-09-02T09:00:00',
    end_date: '2026-09-02T17:30:00',
    status: 'DRAFT',
  },
];

const SAMPLE_VENUES = [
  {
    id: 1,
    venue_id: 1,
    name: 'Grand Auditorium',
    location: 'North Campus',
    capacity: 500,
    venueType: 'Auditorium',
    facilities: ['Wi-Fi', 'Stage', 'Projector', 'Recording', 'Wheelchair Access'],
    equipment: ['Microphones', 'LED Screen', 'Audio Mixer'],
    accessibility: ['Wheelchair Access', 'Lift'],
    setupTime: 45,
    cleanupTime: 30,
    status: 'available',
    availability: [{ day: 'Wed', start: '09:00', end: '18:00' }],
  },
  {
    id: 2,
    venue_id: 2,
    name: 'Innovation Hall',
    location: 'Research Wing',
    capacity: 220,
    venueType: 'Conference Hall',
    facilities: ['Wi-Fi', 'Whiteboard', 'Projector'],
    equipment: ['Laptop Dock', 'Display Screen'],
    accessibility: ['Wheelchair Access'],
    setupTime: 25,
    cleanupTime: 20,
    status: 'available',
    availability: [{ day: 'Wed', start: '08:00', end: '17:00' }],
  },
  {
    id: 3,
    venue_id: 3,
    name: 'Summit Lab',
    location: 'Innovation Center',
    capacity: 120,
    venueType: 'Workshop Room',
    facilities: ['Whiteboard', 'Wi-Fi'],
    equipment: ['Laptop Station', 'Projector'],
    accessibility: ['Wheelchair Access'],
    setupTime: 15,
    cleanupTime: 15,
    status: 'available',
    availability: [{ day: 'Thu', start: '09:00', end: '17:00' }],
  },
  {
    id: 4,
    venue_id: 4,
    name: 'Sky Pavilion',
    location: 'Riverside Wing',
    capacity: 320,
    venueType: 'Expo Hall',
    facilities: ['Wi-Fi', 'Stage', 'Lighting'],
    equipment: ['Projector', 'Audio Console', 'LED Wall'],
    accessibility: ['Wheelchair Access', 'Elevator'],
    setupTime: 40,
    cleanupTime: 25,
    status: 'maintenance',
    availability: [{ day: 'Thu', start: '10:00', end: '18:00' }],
  },
  {
    id: 5,
    venue_id: 5,
    name: 'Harbor Studio',
    location: 'City Annex',
    capacity: 90,
    venueType: 'Workshop Room',
    facilities: ['Wi-Fi', 'Whiteboard'],
    equipment: ['Portable Screen'],
    accessibility: ['Wheelchair Access'],
    setupTime: 10,
    cleanupTime: 10,
    status: 'available',
    availability: [{ day: 'Fri', start: '09:00', end: '16:00' }],
  },
];

const SAMPLE_SPEAKERS = [
  {
    id: 1,
    speaker_id: 1,
    name: 'Dr. Aisha Verma',
    email: 'aisha@eventai.local',
    bio: 'AI strategist and keynote speaker focused on ethical AI and enterprise modernization.',
    expertise: ['AI', 'Strategy', 'Leadership'],
    languages: ['English', 'Hindi'],
    preferredSessionTypes: ['Keynote', 'Panel'],
    preferredTopics: ['AI Governance', 'Responsible AI'],
    availability: [{ day: 'Wed', start: '09:00', end: '12:00' }],
    status: 'active',
  },
  {
    id: 2,
    speaker_id: 2,
    name: 'Rohan Patel',
    email: 'rohan@eventai.local',
    bio: 'Product design leader with experience in user research and AI experiences.',
    expertise: ['UX', 'Design', 'Product'],
    languages: ['English'],
    preferredSessionTypes: ['Workshop', 'Panel'],
    preferredTopics: ['Product Design', 'UX Research'],
    availability: [{ day: 'Wed', start: '11:00', end: '15:00' }],
    status: 'active',
  },
  {
    id: 3,
    speaker_id: 3,
    name: 'Priya Nair',
    email: 'priya@eventai.local',
    bio: 'Cloud architect and sustainability advocate working on urban AI systems.',
    expertise: ['Cloud', 'Infrastructure', 'Smart Cities'],
    languages: ['English', 'Tamil'],
    preferredSessionTypes: ['Workshop', 'Talk'],
    preferredTopics: ['Smart Cities', 'Scalable Systems'],
    availability: [{ day: 'Thu', start: '09:00', end: '13:00' }],
    status: 'active',
  },
  {
    id: 4,
    speaker_id: 4,
    name: 'Dr. Arun Kumar',
    email: 'arun@eventai.local',
    bio: 'Machine learning researcher specializing in computer vision and analytics.',
    expertise: ['Machine Learning', 'Vision', 'Analytics'],
    languages: ['English', 'Hindi'],
    preferredSessionTypes: ['Talk', 'Workshop'],
    preferredTopics: ['Computer Vision', 'ML Ops'],
    availability: [{ day: 'Thu', start: '13:00', end: '17:00' }],
    status: 'active',
  },
  {
    id: 5,
    speaker_id: 5,
    name: 'Sana Ali',
    email: 'sana@eventai.local',
    bio: 'Public policy strategist connecting civic technology to measurable outcomes.',
    expertise: ['Policy', 'Mobility', 'Leadership'],
    languages: ['English', 'Arabic'],
    preferredSessionTypes: ['Panel', 'Talk'],
    preferredTopics: ['Urban Mobility', 'Civic Technology'],
    availability: [{ day: 'Fri', start: '10:00', end: '16:00' }],
    status: 'active',
  },
  {
    id: 6,
    speaker_id: 6,
    name: 'Meera Shah',
    email: 'meera@eventai.local',
    bio: 'Data storyteller focused on customer insight and AI adoption in fintech.',
    expertise: ['Data', 'Analytics', 'Fintech'],
    languages: ['English'],
    preferredSessionTypes: ['Keynote', 'Talk'],
    preferredTopics: ['Data Storytelling', 'AI Adoption'],
    availability: [{ day: 'Thu', start: '09:00', end: '16:00' }],
    status: 'inactive',
  },
];

const SAMPLE_SESSIONS = [
  {
    id: 1,
    session_id: 1,
    event_id: 1,
    title: 'Opening Keynote',
    session_name: 'Opening Keynote',
    description: 'Opening address on AI strategy and enterprise adoption in 2026.',
    sessionType: 'Keynote',
    expectedAttendance: 320,
    requiredFacilities: ['Stage', 'Wi-Fi', 'Projector'],
    requiredEquipment: ['Microphones', 'LED Screen'],
    preferredVenueType: 'Auditorium',
    start_time: '2026-08-20T09:00:00',
    end_time: '2026-08-20T10:30:00',
    venue_id: 1,
    speaker_id: 1,
    status: 'scheduled',
  },
  {
    id: 2,
    session_id: 2,
    event_id: 1,
    title: 'Designing Trustworthy AI',
    session_name: 'Designing Trustworthy AI',
    description: 'Product and engineering practices for responsible AI systems.',
    sessionType: 'Workshop',
    expectedAttendance: 180,
    requiredFacilities: ['Wi-Fi', 'Whiteboard'],
    requiredEquipment: ['Laptop Dock'],
    preferredVenueType: 'Conference Hall',
    start_time: '2026-08-20T11:00:00',
    end_time: '2026-08-20T12:30:00',
    venue_id: 2,
    speaker_id: 2,
    status: 'scheduled',
  },
  {
    id: 3,
    session_id: 3,
    event_id: 1,
    title: 'AI in Smart Cities',
    session_name: 'AI in Smart Cities',
    description: 'Deployment of AI for mobility and citizen services.',
    sessionType: 'Talk',
    expectedAttendance: 140,
    requiredFacilities: ['Wi-Fi', 'Projector'],
    requiredEquipment: ['Microphones'],
    preferredVenueType: 'Workshop Room',
    start_time: '2026-08-21T09:30:00',
    end_time: '2026-08-21T10:45:00',
    venue_id: 3,
    speaker_id: 3,
    status: 'scheduled',
  },
  {
    id: 4,
    session_id: 4,
    event_id: 2,
    title: 'Women Leading AI',
    session_name: 'Women Leading AI',
    description: 'A conversation about leadership, inclusion, and innovation.',
    sessionType: 'Panel',
    expectedAttendance: 210,
    requiredFacilities: ['Stage', 'Wi-Fi'],
    requiredEquipment: ['Microphones', 'LED Screen'],
    preferredVenueType: 'Auditorium',
    start_time: '2026-08-21T10:00:00',
    end_time: '2026-08-21T11:30:00',
    venue_id: 1,
    speaker_id: 5,
    status: 'scheduled',
  },
  {
    id: 5,
    session_id: 5,
    event_id: 2,
    title: 'Beyond the Dashboard',
    session_name: 'Beyond the Dashboard',
    description: 'Making AI insights useful for product and operations teams.',
    sessionType: 'Talk',
    expectedAttendance: 90,
    requiredFacilities: ['Wi-Fi'],
    requiredEquipment: ['Laptop Dock'],
    preferredVenueType: 'Workshop Room',
    start_time: '2026-08-21T14:00:00',
    end_time: '2026-08-21T15:00:00',
    venue_id: 5,
    speaker_id: 2,
    status: 'scheduled',
  },
  {
    id: 6,
    session_id: 6,
    event_id: 3,
    title: 'Vision for Urban AI',
    session_name: 'Vision for Urban AI',
    description: 'Applying computer vision in mobility and public services.',
    sessionType: 'Workshop',
    expectedAttendance: 150,
    requiredFacilities: ['Wi-Fi', 'Projector'],
    requiredEquipment: ['Display Screen'],
    preferredVenueType: 'Conference Hall',
    start_time: '2026-08-22T09:00:00',
    end_time: '2026-08-22T10:30:00',
    venue_id: 2,
    speaker_id: 4,
    status: 'scheduled',
  },
  {
    id: 7,
    session_id: 7,
    event_id: 3,
    title: 'Data Storytelling for Leaders',
    session_name: 'Data Storytelling for Leaders',
    description: 'Turning metrics into boardroom-ready narratives.',
    sessionType: 'Keynote',
    expectedAttendance: 200,
    requiredFacilities: ['Projector', 'Stage'],
    requiredEquipment: ['Microphones', 'LED Screen'],
    preferredVenueType: 'Auditorium',
    start_time: '2026-08-22T12:00:00',
    end_time: '2026-08-22T13:15:00',
    venue_id: 1,
    speaker_id: 6,
    status: 'scheduled',
  },
  {
    id: 8,
    session_id: 8,
    event_id: 2,
    title: 'AI Maturity Metrics',
    session_name: 'AI Maturity Metrics',
    description: 'Assessing readiness and creating sustainable AI programs.',
    sessionType: 'Talk',
    expectedAttendance: 75,
    requiredFacilities: ['Wi-Fi', 'Whiteboard'],
    requiredEquipment: ['Laptop Station'],
    preferredVenueType: 'Workshop Room',
    start_time: '2026-08-22T15:00:00',
    end_time: '2026-08-22T16:00:00',
    venue_id: 5,
    speaker_id: 6,
    status: 'scheduled',
  },
];

const SAMPLE_VENUE_BOOKINGS = [
  { id: 1, booking_id: 1, venue_id: 1, event_id: 1, start_time: '2026-08-20T09:00:00', end_time: '2026-08-20T10:30:00', status: 'confirmed' },
  { id: 2, booking_id: 2, venue_id: 2, event_id: 1, start_time: '2026-08-20T11:00:00', end_time: '2026-08-20T12:30:00', status: 'confirmed' },
  { id: 3, booking_id: 3, venue_id: 1, event_id: 2, start_time: '2026-08-21T10:00:00', end_time: '2026-08-21T11:30:00', status: 'confirmed' },
  { id: 4, booking_id: 4, venue_id: 5, event_id: 2, start_time: '2026-08-21T14:00:00', end_time: '2026-08-21T15:00:00', status: 'confirmed' },
  { id: 5, booking_id: 5, venue_id: 2, event_id: 3, start_time: '2026-08-22T09:00:00', end_time: '2026-08-22T10:30:00', status: 'confirmed' },
  { id: 6, booking_id: 6, venue_id: 1, event_id: 3, start_time: '2026-08-22T12:00:00', end_time: '2026-08-22T13:15:00', status: 'confirmed' },
];

const SAMPLE_SPEAKER_ASSIGNMENTS = [
  { id: 1, assignment_id: 1, speaker_id: 1, session_id: 1, start_time: '2026-08-20T09:00:00', end_time: '2026-08-20T10:30:00', status: 'assigned' },
  { id: 2, assignment_id: 2, speaker_id: 2, session_id: 2, start_time: '2026-08-20T11:00:00', end_time: '2026-08-20T12:30:00', status: 'assigned' },
  { id: 3, assignment_id: 3, speaker_id: 3, session_id: 3, start_time: '2026-08-21T09:30:00', end_time: '2026-08-21T10:45:00', status: 'assigned' },
  { id: 4, assignment_id: 4, speaker_id: 5, session_id: 4, start_time: '2026-08-21T10:00:00', end_time: '2026-08-21T11:30:00', status: 'assigned' },
  { id: 5, assignment_id: 5, speaker_id: 2, session_id: 5, start_time: '2026-08-21T14:00:00', end_time: '2026-08-21T15:00:00', status: 'assigned' },
  { id: 6, assignment_id: 6, speaker_id: 4, session_id: 6, start_time: '2026-08-22T09:00:00', end_time: '2026-08-22T10:30:00', status: 'assigned' },
  { id: 7, assignment_id: 7, speaker_id: 6, session_id: 7, start_time: '2026-08-22T12:00:00', end_time: '2026-08-22T13:15:00', status: 'assigned' },
];

const SAMPLE_ATTENDANCE = [
  { id: 1, attendance_id: 1, participant_email: 'participant@eventai.local', session_id: 1, status: 'checked-in', check_in: '2026-08-20T09:10:00', check_out: '2026-08-20T10:25:00' },
  { id: 2, attendance_id: 2, participant_email: 'participant@eventai.local', session_id: 2, status: 'checked-out', check_in: '2026-08-20T11:05:00', check_out: '2026-08-20T12:25:00' },
  { id: 3, attendance_id: 3, participant_email: 'demo.user@example.com', session_id: 4, status: 'pending', check_in: null, check_out: null },
];

const SAMPLE_FEEDBACK = [
  { id: 1, feedback_id: 1, session_id: 1, user_email: 'participant@eventai.local', rating: 5, comment: 'Excellent keynote with practical AI guidance.', created_at: '2026-08-20T11:00:00' },
  { id: 2, feedback_id: 2, session_id: 2, user_email: 'demo.user@example.com', rating: 4, comment: 'Helpful workshop and very actionable.', created_at: '2026-08-20T12:45:00' },
];

const SAMPLE_REGISTRATIONS = [
  {
    id: 1,
    registrationId: 'REG-1001',
    fullName: 'Participant User',
    email: 'participant@eventai.local',
    phone: '9999999999',
    age: 26,
    gender: 'Female',
    department: 'Engineering',
    occupation: 'Product Manager',
    city: 'Bangalore',
    checkedIn: true,
    createdAt: '2026-08-15T08:00:00',
    eventIds: [1, 2],
  },
  {
    id: 2,
    registrationId: 'REG-1002',
    fullName: 'Demo User',
    email: 'demo.user@example.com',
    phone: '8888888888',
    age: 31,
    gender: 'Male',
    department: 'Data',
    occupation: 'Data Scientist',
    city: 'Mumbai',
    checkedIn: false,
    createdAt: '2026-08-15T09:15:00',
    eventIds: [1, 3],
  },
];

const SAMPLE_NOTIFICATIONS = [
  { id: 1, notification_id: 1, title: 'Welcome to EventAI', message: 'Your profile is ready for session access.', type: 'info', recipient_email: 'participant@eventai.local', recipient_role: 'user', is_read: false, created_at: '2026-08-15T08:05:00' },
  { id: 2, notification_id: 2, title: 'Venue update', message: 'The keynote venue has been confirmed for the morning session.', type: 'alert', recipient_email: 'admin@eventai.local', recipient_role: 'admin', is_read: false, created_at: '2026-08-15T08:15:00' },
];

const SAMPLE_USERS = [
  { id: 1, name: 'System Admin', email: 'admin@eventai.local', phone: '0000000000', password: 'admin123', role: 'admin', created_at: '2026-08-15T00:00:00' },
  { id: 2, name: 'Participant User', email: 'participant@eventai.local', phone: '9999999999', password: 'user123', role: 'user', created_at: '2026-08-15T00:00:00' },
  { id: 3, name: 'Staff Member', email: 'staff@eventai.local', phone: '7777777777', password: 'Staff@123', role: 'staff', department: 'Technical Support', status: 'Active', created_at: '2026-08-15T00:00:00' },
];

const SAMPLE_TECHNICIANS = [
  {
    id: 1,
    technician_id: 1,
    name: 'Alex Morgan',
    skills: ['Network', 'IT Support', 'Wi-Fi', 'Security'],
    experience: '6 years',
    availability: 'Available',
    phone: '+1 (555) 234-5678',
    email: 'alex.m@eventai.local',
  },
  {
    id: 2,
    technician_id: 2,
    name: 'Sarah Chen',
    skills: ['AV Equipment', 'Audio Mixer', 'Microphones', 'LED Screen'],
    experience: '8 years',
    availability: 'Available',
    phone: '+1 (555) 345-6789',
    email: 'sarah.c@eventai.local',
  },
  {
    id: 3,
    technician_id: 3,
    name: 'David Miller',
    skills: ['Electrical', 'Lighting', 'HVAC', 'Power Grid'],
    experience: '10 years',
    availability: 'Available',
    phone: '+1 (555) 456-7890',
    email: 'david.m@eventai.local',
  },
  {
    id: 4,
    technician_id: 4,
    name: 'Priya Sharma',
    skills: ['Stage Management', 'Seating', 'Logistics', 'Accessibility'],
    experience: '5 years',
    availability: 'Busy',
    phone: '+1 (555) 567-8901',
    email: 'priya.s@eventai.local',
  },
  {
    id: 5,
    technician_id: 5,
    name: 'Marcus Vance',
    skills: ['Security', 'Access Control', 'Crowd Control', 'Emergency'],
    experience: '7 years',
    availability: 'Available',
    phone: '+1 (555) 678-9012',
    email: 'marcus.v@eventai.local',
  },
];

const SAMPLE_INCIDENTS = [
  {
    id: 1,
    incident_id: 1,
    title: 'Main Hall Wi-Fi Connectivity Drop',
    description: 'Attendees in Grand Auditorium reporting frequent Wi-Fi disconnections during session 1.',
    category: 'Network',
    priority: 'HIGH',
    status: 'NEW',
    location: 'Grand Auditorium',
    user_email: 'participant@eventai.local',
    user_name: 'Participant User',
    assigned_technician_id: null,
    assigned_technician_name: null,
    created_at: '2026-08-20T10:15:00',
    updated_at: '2026-08-20T10:15:00',
  },
  {
    id: 2,
    incident_id: 2,
    title: 'Microphone Audio Feedback in Workshop',
    description: 'Persistent audio screeching from wireless mic setup in Summit Lab.',
    category: 'AV Equipment',
    priority: 'MEDIUM',
    status: 'UNDER REVIEW',
    location: 'Summit Lab',
    user_email: 'participant@eventai.local',
    user_name: 'Participant User',
    assigned_technician_id: null,
    assigned_technician_name: null,
    created_at: '2026-08-20T11:30:00',
    updated_at: '2026-08-20T11:30:00',
  },
];

const SAMPLE_DATA = {
  [STORAGE_KEYS.events]: SAMPLE_EVENTS,
  [STORAGE_KEYS.venues]: SAMPLE_VENUES,
  [STORAGE_KEYS.speakers]: SAMPLE_SPEAKERS,
  [STORAGE_KEYS.sessions]: SAMPLE_SESSIONS,
  [STORAGE_KEYS.venueBookings]: SAMPLE_VENUE_BOOKINGS,
  [STORAGE_KEYS.speakerAssignments]: SAMPLE_SPEAKER_ASSIGNMENTS,
  [STORAGE_KEYS.attendance]: SAMPLE_ATTENDANCE,
  [STORAGE_KEYS.feedback]: SAMPLE_FEEDBACK,
  [STORAGE_KEYS.registrations]: SAMPLE_REGISTRATIONS,
  [STORAGE_KEYS.notifications]: SAMPLE_NOTIFICATIONS,
  [STORAGE_KEYS.users]: SAMPLE_USERS,
  [STORAGE_KEYS.technicians]: SAMPLE_TECHNICIANS,
  [STORAGE_KEYS.incidents]: SAMPLE_INCIDENTS,
};

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    key(index) {
      return Array.from(store.keys())[Number(index)] || null;
    },
    get length() {
      return store.size;
    },
  };
}

export function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  if (!globalThis.__eventaiStorage) {
    globalThis.__eventaiStorage = createMemoryStorage();
  }

  return globalThis.__eventaiStorage;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function readEntity(entityName, fallback = []) {
  const storage = getStorage();
  const raw = storage.getItem(entityName);
  if (raw === null || raw === undefined) {
    return Array.isArray(fallback) ? fallback.slice() : [];
  }
  const parsed = normalizeArray(raw);
  return parsed.length ? parsed : Array.isArray(fallback) ? fallback.slice() : [];
}

export function writeEntity(entityName, data) {
  const storage = getStorage();
  const payload = Array.isArray(data) ? data : [];
  storage.setItem(entityName, JSON.stringify(payload));
  return payload;
}

export function ensureEntityFile(entityName, defaultValue = []) {
  const storage = getStorage();
  if (!storage.getItem(entityName)) {
    storage.setItem(entityName, JSON.stringify(defaultValue));
  }
  return readEntity(entityName, defaultValue);
}

export function nextId(items, idField = 'id') {
  if (!Array.isArray(items) || items.length === 0) return 1;
  const max = items.reduce((highest, item) => Math.max(highest, Number(item?.[idField] ?? 0) || 0), 0);
  return max + 1;
}

export function withWriteLock(entityName, fn) {
  const storage = getStorage();
  const lockKey = `${entityName}:lock`;
  if (storage.getItem(lockKey) === 'locked') {
    throw new Error(`Write lock active for ${entityName}. Please retry.`);
  }

  storage.setItem(lockKey, 'locked');
  try {
    const result = fn();
    storage.removeItem(lockKey);
    return result;
  } catch (error) {
    storage.removeItem(lockKey);
    throw error;
  }
}

export function initializeLocalData() {
  Object.entries(SAMPLE_DATA).forEach(([key, value]) => ensureEntityFile(key, value));
}

export function resetLocalData() {
  const storage = getStorage();
  Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
  initializeLocalData();
}

export function getUsers() {
  return readEntity(STORAGE_KEYS.users, SAMPLE_USERS);
}

export function saveUsers(users) {
  writeEntity(STORAGE_KEYS.users, users);
  return users;
}

export function getEvents() {
  return readEntity(STORAGE_KEYS.events, SAMPLE_EVENTS);
}

export function createEvent(payload) {
  const list = getEvents();
  const clean = { ...payload };
  const eventId = nextId(list, 'event_id');
  const record = {
    id: eventId,
    event_id: eventId,
    name: clean.name || 'Untitled Event',
    description: clean.description || '',
    location: clean.location || 'TBA',
    start_date: clean.startDate || clean.start_date || new Date().toISOString(),
    end_date: clean.endDate || clean.end_date || new Date().toISOString(),
    status: clean.status || 'DRAFT',
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.events, list);
  return record;
}

export function updateEvent(id, payload) {
  const list = getEvents();
  const index = list.findIndex((entry) => Number(entry.event_id) === Number(id) || Number(entry.id) === Number(id));
  if (index === -1) return null;
  list[index] = {
    ...list[index],
    ...payload,
    event_id: Number(list[index].event_id || list[index].id || id),
    id: Number(list[index].id || list[index].event_id || id),
    name: payload.name || list[index].name,
    description: payload.description ?? list[index].description,
    location: payload.location ?? list[index].location,
    start_date: payload.startDate || payload.start_date || list[index].start_date,
    end_date: payload.endDate || payload.end_date || list[index].end_date,
    status: payload.status || list[index].status,
  };
  writeEntity(STORAGE_KEYS.events, list);
  return list[index];
}

export function deleteEvent(id) {
  const list = getEvents().filter((entry) => Number(entry.event_id) !== Number(id) && Number(entry.id) !== Number(id));
  writeEntity(STORAGE_KEYS.events, list);
  return true;
}

export function getVenues() {
  return readEntity(STORAGE_KEYS.venues, SAMPLE_VENUES);
}

export function createVenue(payload) {
  const list = getVenues();
  const venueId = nextId(list, 'venue_id');
  const record = {
    id: venueId,
    venue_id: venueId,
    name: payload.name || 'Untitled Venue',
    location: payload.location || 'TBA',
    capacity: Number(payload.capacity || 0),
    venueType: payload.venueType || payload.type || 'Conference Hall',
    facilities: Array.isArray(payload.facilities) ? payload.facilities : [],
    equipment: Array.isArray(payload.equipment) ? payload.equipment : [],
    accessibility: Array.isArray(payload.accessibility) ? payload.accessibility : [],
    setupTime: Number(payload.setupTime || 0),
    cleanupTime: Number(payload.cleanupTime || 0),
    status: payload.status || 'available',
    availability: Array.isArray(payload.availability) ? payload.availability : [{ day: 'Mon', start: '09:00', end: '17:00' }],
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.venues, list);
  return record;
}

export function updateVenue(id, payload) {
  const list = getVenues();
  const index = list.findIndex((entry) => Number(entry.venue_id) === Number(id) || Number(entry.id) === Number(id));
  if (index === -1) return null;
  list[index] = {
    ...list[index],
    ...payload,
    venue_id: Number(list[index].venue_id || list[index].id || id),
    id: Number(list[index].id || list[index].venue_id || id),
    status: payload.status || list[index].status,
    capacity: Number(payload.capacity ?? list[index].capacity),
    facilities: Array.isArray(payload.facilities) ? payload.facilities : list[index].facilities,
    equipment: Array.isArray(payload.equipment) ? payload.equipment : list[index].equipment,
    accessibility: Array.isArray(payload.accessibility) ? payload.accessibility : list[index].accessibility,
    setupTime: Number(payload.setupTime ?? list[index].setupTime),
    cleanupTime: Number(payload.cleanupTime ?? list[index].cleanupTime),
  };
  writeEntity(STORAGE_KEYS.venues, list);
  return list[index];
}

export function deleteVenue(id) {
  const list = getVenues().filter((entry) => Number(entry.venue_id) !== Number(id) && Number(entry.id) !== Number(id));
  writeEntity(STORAGE_KEYS.venues, list);
  return true;
}

export function getSpeakers() {
  return readEntity(STORAGE_KEYS.speakers, SAMPLE_SPEAKERS);
}

export function createSpeaker(payload) {
  const list = getSpeakers();
  const speakerId = nextId(list, 'speaker_id');
  const record = {
    id: speakerId,
    speaker_id: speakerId,
    name: payload.name || 'Untitled Speaker',
    email: payload.email || 'speaker@example.com',
    bio: payload.bio || '',
    expertise: Array.isArray(payload.expertise) ? payload.expertise : [],
    languages: Array.isArray(payload.languages) ? payload.languages : [],
    preferredSessionTypes: Array.isArray(payload.preferredSessionTypes) ? payload.preferredSessionTypes : [],
    preferredTopics: Array.isArray(payload.preferredTopics) ? payload.preferredTopics : [],
    availability: Array.isArray(payload.availability) ? payload.availability : [],
    status: payload.status || 'active',
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.speakers, list);
  return record;
}

export function updateSpeaker(id, payload) {
  const list = getSpeakers();
  const index = list.findIndex((entry) => Number(entry.speaker_id) === Number(id) || Number(entry.id) === Number(id));
  if (index === -1) return null;
  list[index] = {
    ...list[index],
    ...payload,
    speaker_id: Number(list[index].speaker_id || list[index].id || id),
    id: Number(list[index].id || list[index].speaker_id || id),
    expertise: Array.isArray(payload.expertise) ? payload.expertise : list[index].expertise,
    languages: Array.isArray(payload.languages) ? payload.languages : list[index].languages,
    preferredSessionTypes: Array.isArray(payload.preferredSessionTypes) ? payload.preferredSessionTypes : list[index].preferredSessionTypes,
    preferredTopics: Array.isArray(payload.preferredTopics) ? payload.preferredTopics : list[index].preferredTopics,
    availability: Array.isArray(payload.availability) ? payload.availability : list[index].availability,
    status: payload.status || list[index].status,
  };
  writeEntity(STORAGE_KEYS.speakers, list);
  return list[index];
}

export function deleteSpeaker(id) {
  const list = getSpeakers().filter((entry) => Number(entry.speaker_id) !== Number(id) && Number(entry.id) !== Number(id));
  writeEntity(STORAGE_KEYS.speakers, list);
  return true;
}

export function getSessions() {
  return readEntity(STORAGE_KEYS.sessions, SAMPLE_SESSIONS);
}

export function getVenueBookings() {
  return readEntity(STORAGE_KEYS.venueBookings, SAMPLE_VENUE_BOOKINGS);
}

export function getSpeakerAssignments() {
  return readEntity(STORAGE_KEYS.speakerAssignments, SAMPLE_SPEAKER_ASSIGNMENTS);
}

export function checkVenueAvailability(venueId, startTime, endTime, excludeBookingId = null) {
  const bookings = getVenueBookings();
  const conflict = bookings.find((booking) => {
    if (Number(booking.venue_id) !== Number(venueId)) return false;
    if (excludeBookingId && Number(booking.booking_id) === Number(excludeBookingId)) return false;
    if (booking.status === 'cancelled') return false;
    const bookingStart = new Date(booking.start_time).getTime();
    const bookingEnd = new Date(booking.end_time).getTime();
    const candidateStart = new Date(startTime).getTime();
    const candidateEnd = new Date(endTime).getTime();
    return candidateStart < bookingEnd && candidateEnd > bookingStart;
  });

  const venue = getVenues().find((item) => Number(item.venue_id) === Number(venueId));
  return {
    available: !conflict && (!venue || venue.status === 'available'),
    conflict,
    venue,
    reason: conflict ? 'Venue is already booked during the selected time window.' : (!venue ? 'Venue not found.' : venue.status === 'available' ? null : 'Venue is not active.'),
  };
}

export function checkSpeakerAvailability(speakerId, startTime, endTime, excludeAssignmentId = null) {
  const assignments = getSpeakerAssignments();
  const conflict = assignments.find((assignment) => {
    if (Number(assignment.speaker_id) !== Number(speakerId)) return false;
    if (excludeAssignmentId && Number(assignment.assignment_id) === Number(excludeAssignmentId)) return false;
    const assignmentStart = new Date(assignment.start_time).getTime();
    const assignmentEnd = new Date(assignment.end_time).getTime();
    const candidateStart = new Date(startTime).getTime();
    const candidateEnd = new Date(endTime).getTime();
    return candidateStart < assignmentEnd && candidateEnd > assignmentStart;
  });

  const speaker = getSpeakers().find((item) => Number(item.speaker_id) === Number(speakerId));
  return {
    available: !conflict && (!speaker || speaker.status === 'active'),
    conflict,
    speaker,
    reason: conflict ? 'Speaker is already assigned during the selected time window.' : (!speaker ? 'Speaker not found.' : speaker.status === 'active' ? null : 'Speaker is not active.'),
  };
}

function toIdList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).toLowerCase());
  return [];
}

function stringContainsAny(value, list) {
  const source = String(value || '').toLowerCase();
  return list.some((item) => source.includes(String(item).toLowerCase()));
}

export function recommendVenues(options = {}) {
  const { expectedAttendance = 0, requiredFacilities = [], requiredEquipment = [], sessionType = '', preferredVenueType = '', startTime, endTime } = options;
  const facilities = toIdList(requiredFacilities);
  const equipment = toIdList(requiredEquipment);
  const venues = getVenues();

  const ranked = venues
    .map((venue) => {
      const facilityMatch = facilities.every((facility) => toIdList(venue.facilities).includes(facility));
      const equipmentMatch = equipment.every((item) => toIdList(venue.equipment).includes(item));
      const capacityOk = Number(venue.capacity || 0) >= Number(expectedAttendance || 0);
      const venueTypeMatch = !preferredVenueType || String(venue.venueType || '').toLowerCase() === String(preferredVenueType).toLowerCase();
      const availabilityCheck = startTime && endTime ? checkVenueAvailability(venue.venue_id, startTime, endTime) : { available: true, conflict: null };
      const utilization = venue.capacity ? Math.min(100, Math.round((Number(expectedAttendance || 0) / Number(venue.capacity)) * 100)) : 0;
      let score = 0;
      if (capacityOk) score += 30;
      if (facilityMatch) score += 20;
      if (equipmentMatch) score += 15;
      if (venueTypeMatch) score += 10;
      if (availabilityCheck.available) score += 20;
      if (venue.status === 'available') score += 5;
      if (sessionType) {
        const lower = String(sessionType).toLowerCase();
        if (String(venue.venueType || '').toLowerCase().includes(lower)) score += 5;
      }
      const reasons = [];
      if (!capacityOk) reasons.push('Capacity is smaller than expected attendance.');
      if (!facilityMatch) reasons.push('Missing required facilities.');
      if (!equipmentMatch) reasons.push('Missing required equipment.');
      if (!availabilityCheck.available) reasons.push('Venue is unavailable during the selected time window.');
      if (utilization > 85) reasons.push('High utilization may strain the room.');
      if (utilization < 40) reasons.push('Underutilized venue; a smaller room may be more efficient.');
      return {
        ...venue,
        capacityOk,
        facilityMatch,
        equipmentMatch,
        venueTypeMatch,
        available: availabilityCheck.available,
        utilization,
        matchScore: score,
        reasons: reasons.length ? reasons : ['Well matched to the session requirements.'],
      };
    })
    .filter((venue) => venue.status !== 'inactive');

  const sorted = ranked.sort((a, b) => b.matchScore - a.matchScore);
  const recommended = sorted.find((item) => item.capacityOk && item.available && item.facilityMatch && item.equipmentMatch) || sorted[0] || null;
  const alternatives = sorted.filter((item) => item.venue_id !== recommended?.venue_id).slice(0, 3);
  return { recommended, alternatives, ranked: sorted };
}

export function recommendSpeakers(options = {}) {
  const { expertise = [], topic = '', sessionType = '', languages = [], startTime, endTime } = options;
  const expertiseTerms = toIdList(expertise);
  const preferredLanguages = toIdList(languages);
  const speakers = getSpeakers();

  const ranked = speakers
    .map((speaker) => {
      const expertiseScore = expertiseTerms.length
        ? expertiseTerms.filter((term) => toIdList(speaker.expertise).some((value) => value.includes(term) || term.includes(value))).length
        : 0;
      const topicMatch = topic ? String(topic).toLowerCase().includes(String(speaker.preferredTopics || []).join(' ').toLowerCase()) || stringContainsAny(topic, speaker.preferredTopics || []) : true;
      const sessionMatch = sessionType ? toIdList(speaker.preferredSessionTypes).includes(String(sessionType).toLowerCase()) : true;
      const languageMatch = preferredLanguages.length ? preferredLanguages.some((value) => toIdList(speaker.languages).includes(value)) : true;
      const availabilityCheck = startTime && endTime ? checkSpeakerAvailability(speaker.speaker_id, startTime, endTime) : { available: true, conflict: null };
      let score = 0;
      if (expertiseScore > 0) score += 30 + expertiseScore * 10;
      if (topicMatch) score += 20;
      if (sessionMatch) score += 15;
      if (languageMatch) score += 10;
      if (availabilityCheck.available) score += 20;
      if (speaker.status === 'active') score += 5;
      const reasons = [];
      if (!topicMatch) reasons.push('Topic does not align strongly with the speaker profile.');
      if (!sessionMatch) reasons.push('Preferred session type does not match the requested format.');
      if (!languageMatch) reasons.push('Required language preference is not covered.');
      if (!availabilityCheck.available) reasons.push('Speaker is unavailable during the selected time window.');
      return {
        ...speaker,
        matchScore: score,
        available: availabilityCheck.available,
        reasons: reasons.length ? reasons : ['Strong alignment with session topic and availability.'],
      };
    })
    .filter((speaker) => speaker.status !== 'inactive');

  const sorted = ranked.sort((a, b) => b.matchScore - a.matchScore);
  const recommended = sorted.find((item) => item.available) || sorted[0] || null;
  const alternatives = sorted.filter((item) => item.speaker_id !== recommended?.speaker_id).slice(0, 3);
  return { recommended, alternatives, ranked: sorted };
}

export function optimizeVenue(session) {
  const venue = getVenues().find((item) => Number(item.venue_id) === Number(session.venue_id));
  const expected = Number(session.expectedAttendance || 0);
  const capacity = Number(venue?.capacity || 0);
  const utilization = capacity ? Math.round((expected / capacity) * 100) : 0;

  if (!venue) {
    return { recommendation: 'No venue assigned. Recommend a venue with enough capacity and matching facilities.', utilization, action: 'assign' };
  }

  if (expected > capacity) {
    const upgrades = getVenues().filter((item) => Number(item.capacity) >= expected && item.status === 'available');
    const recommendation = upgrades.length ? `Upgrade to ${upgrades[0].name} for adequate capacity.` : 'No suitable upgrade venue is currently available.';
    return { recommendation, utilization, action: 'upgrade', alternativeVenue: upgrades[0] || null };
  }

  if (utilization < 35) {
    const downgrades = getVenues().filter((item) => Number(item.capacity) >= expected && Number(item.capacity) < capacity && item.status === 'available');
    const candidate = downgrades.sort((a, b) => a.capacity - b.capacity)[0];
    const recommendation = candidate ? `Downgrade to ${candidate.name} to improve room utilization.` : 'Current room is acceptable for the expected attendance.';
    return { recommendation, utilization, action: 'downgrade', alternativeVenue: candidate || null };
  }

  return { recommendation: 'Current venue utilization is within the target range.', utilization, action: 'keep' };
}

export function detectConflicts() {
  const sessions = getSessions();
  const venueConflicts = [];
  const speakerConflicts = [];
  const capacityConflicts = [];
  const availabilityConflicts = [];

  sessions.forEach((session, index) => {
    const venue = getVenues().find((item) => Number(item.venue_id) === Number(session.venue_id));
    if (venue && Number(session.expectedAttendance || 0) > Number(venue.capacity || 0)) {
      capacityConflicts.push({ session_id: session.session_id, session_name: session.session_name, expected_attendance: session.expectedAttendance, venue_capacity: venue.capacity });
    }

    sessions.slice(index + 1).forEach((other) => {
      if (Number(session.venue_id) === Number(other.venue_id) && new Date(session.start_time) < new Date(other.end_time) && new Date(session.end_time) > new Date(other.start_time)) {
        venueConflicts.push({ session_a: session.session_name, session_b: other.session_name, venue_id: session.venue_id, start_time: session.start_time, end_time: session.end_time });
      }

      if (Number(session.speaker_id) === Number(other.speaker_id) && new Date(session.start_time) < new Date(other.end_time) && new Date(session.end_time) > new Date(other.start_time)) {
        speakerConflicts.push({ session_a: session.session_name, session_b: other.session_name, speaker_id: session.speaker_id, start_time: session.start_time, end_time: session.end_time });
      }
    });

    if (venue && venue.status !== 'available') {
      availabilityConflicts.push({ session_id: session.session_id, session_name: session.session_name, venue_name: venue.name, venue_status: venue.status });
    }
  });

  return { venueConflicts, speakerConflicts, capacityConflicts, availabilityConflicts };
}

export function getRegistrations() {
  return readEntity(STORAGE_KEYS.registrations, SAMPLE_REGISTRATIONS);
}

export function createRegistration(payload) {
  const list = getRegistrations();
  const record = {
    id: nextId(list, 'id'),
    registrationId: payload.registrationId || `REG-${Date.now()}`,
    fullName: payload.fullName || payload.name || 'New Participant',
    email: payload.email || '',
    phone: payload.phone || '',
    age: payload.age || 0,
    gender: payload.gender || 'Other',
    department: payload.department || '',
    occupation: payload.occupation || '',
    city: payload.city || '',
    checkedIn: false,
    createdAt: new Date().toISOString(),
    eventIds: Array.isArray(payload.eventIds) ? payload.eventIds : [],
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.registrations, list);
  return record;
}

export function getAttendance() {
  return readEntity(STORAGE_KEYS.attendance, SAMPLE_ATTENDANCE);
}

export function recordAttendance(payload) {
  const list = getAttendance();
  const record = {
    id: nextId(list, 'id'),
    attendance_id: nextId(list, 'attendance_id'),
    participant_email: payload.participant_email || '',
    session_id: Number(payload.session_id || 0),
    status: payload.status || 'checked-in',
    check_in: payload.check_in || new Date().toISOString(),
    check_out: payload.check_out || null,
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.attendance, list);
  return record;
}

export function getFeedback() {
  return readEntity(STORAGE_KEYS.feedback, SAMPLE_FEEDBACK);
}

export function submitFeedback(payload) {
  const list = getFeedback();
  const record = {
    id: nextId(list, 'id'),
    feedback_id: nextId(list, 'feedback_id'),
    session_id: Number(payload.session_id || 0),
    user_email: payload.user_email || '',
    rating: Number(payload.rating || 0),
    comment: payload.comment || '',
    created_at: new Date().toISOString(),
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.feedback, list);
  return record;
}

export function getNotifications() {
  return readEntity(STORAGE_KEYS.notifications, SAMPLE_NOTIFICATIONS);
}

export function notifyUsers(payload = []) {
  const list = getNotifications();
  const incoming = Array.isArray(payload) ? payload : [payload];
  const merged = [...list, ...incoming.map((item, index) => ({
    id: Number((list.at(-1)?.id || 0)) + index + 1,
    notification_id: Number((list.at(-1)?.notification_id || 0)) + index + 1,
    title: item.title || 'EventAI update',
    message: item.message || '',
    type: item.type || 'info',
    recipient_email: item.recipient_email || 'admin@eventai.local',
    recipient_role: item.recipient_role || 'admin',
    is_read: false,
    created_at: new Date().toISOString(),
  }))];
  writeEntity(STORAGE_KEYS.notifications, merged);
  return merged;
}

export function createSession(payload) {
  const list = getSessions();
  const venueId = payload.venue_id ?? payload.venueId;
  const speakerId = payload.speaker_id ?? payload.speakerId;
  const start = payload.start_time || payload.startTime;
  const end = payload.end_time || payload.endTime;
  const expectedAttendance = Number(payload.expectedAttendance ?? payload.capacity ?? 0);

  if (!start || !end || new Date(start) >= new Date(end)) {
    throw new Error('Session start time must be before end time.');
  }

  if (venueId) {
    const venueCheck = checkVenueAvailability(venueId, start, end);
    if (!venueCheck.available) {
      throw new Error(venueCheck.reason || 'Venue is unavailable for the selected time window.');
    }

    const venue = getVenues().find((item) => Number(item.venue_id) === Number(venueId));
    if (!venue) {
      throw new Error('Venue not found.');
    }
    if (Number(expectedAttendance) > Number(venue.capacity)) {
      throw new Error(`Expected attendance (${expectedAttendance}) exceeds venue capacity (${venue.capacity}).`);
    }
    const requiredFacilities = Array.isArray(payload.requiredFacilities) ? payload.requiredFacilities : [];
    const requiredEquipment = Array.isArray(payload.requiredEquipment) ? payload.requiredEquipment : [];
    const facilityMatch = requiredFacilities.every((facility) => toIdList(venue.facilities).includes(String(facility).toLowerCase()));
    const equipmentMatch = requiredEquipment.every((item) => toIdList(venue.equipment).includes(String(item).toLowerCase()));
    if (!facilityMatch || !equipmentMatch) {
      throw new Error('Selected venue does not include the required facilities or equipment.');
    }
  }

  if (speakerId) {
    const speakerCheck = checkSpeakerAvailability(speakerId, start, end);
    if (!speakerCheck.available) {
      throw new Error(speakerCheck.reason || 'Speaker is unavailable for the selected time window.');
    }
  }

  const sessionId = nextId(list, 'session_id');
  const record = {
    id: sessionId,
    session_id: sessionId,
    event_id: Number(payload.event_id ?? payload.eventId ?? 1),
    title: payload.title || payload.session_name || 'New Session',
    session_name: payload.session_name || payload.title || 'New Session',
    description: payload.description || '',
    sessionType: payload.sessionType || 'Talk',
    expectedAttendance,
    requiredFacilities: Array.isArray(payload.requiredFacilities) ? payload.requiredFacilities : [],
    requiredEquipment: Array.isArray(payload.requiredEquipment) ? payload.requiredEquipment : [],
    preferredVenueType: payload.preferredVenueType || 'Conference Hall',
    start_time: start,
    end_time: end,
    venue_id: venueId ? Number(venueId) : null,
    speaker_id: speakerId ? Number(speakerId) : null,
    status: payload.status || 'scheduled',
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.sessions, list);

  const bookings = getVenueBookings();
  if (venueId) {
    bookings.push({ id: nextId(bookings, 'booking_id'), booking_id: nextId(bookings, 'booking_id'), venue_id: Number(venueId), event_id: Number(record.event_id), start_time: start, end_time: end, status: 'confirmed' });
    writeEntity(STORAGE_KEYS.venueBookings, bookings);
  }

  const assignments = getSpeakerAssignments();
  if (speakerId) {
    assignments.push({ id: nextId(assignments, 'assignment_id'), assignment_id: nextId(assignments, 'assignment_id'), speaker_id: Number(speakerId), session_id: Number(sessionId), start_time: start, end_time: end, status: 'assigned' });
    writeEntity(STORAGE_KEYS.speakerAssignments, assignments);
  }

  return record;
}

export function updateSession(id, payload) {
  const list = getSessions();
  const index = list.findIndex((entry) => Number(entry.session_id) === Number(id) || Number(entry.id) === Number(id));
  if (index === -1) return null;

  const next = {
    ...list[index],
    ...payload,
    title: payload.title || list[index].title || list[index].session_name,
    session_name: payload.session_name || payload.title || list[index].session_name || list[index].title,
    expectedAttendance: Number(payload.expectedAttendance ?? list[index].expectedAttendance ?? list[index].capacity ?? 0),
    start_time: payload.start_time || payload.startTime || list[index].start_time,
    end_time: payload.end_time || payload.endTime || list[index].end_time,
    venue_id: payload.venue_id ?? payload.venueId ?? list[index].venue_id,
    speaker_id: payload.speaker_id ?? payload.speakerId ?? list[index].speaker_id,
    status: payload.status || list[index].status,
  };

  if (next.start_time && next.end_time && new Date(next.start_time) >= new Date(next.end_time)) {
    throw new Error('Session end time must be after start time.');
  }

  if (next.venue_id) {
    const venueCheck = checkVenueAvailability(next.venue_id, next.start_time, next.end_time, list[index].booking_id || null);
    if (!venueCheck.available) {
      throw new Error(venueCheck.reason || 'Venue is unavailable for the selected time window.');
    }
  }

  if (next.speaker_id) {
    const speakerCheck = checkSpeakerAvailability(next.speaker_id, next.start_time, next.end_time, list[index].assignment_id || null);
    if (!speakerCheck.available) {
      throw new Error(speakerCheck.reason || 'Speaker is unavailable for the selected time window.');
    }
  }

  list[index] = next;
  writeEntity(STORAGE_KEYS.sessions, list);
  return list[index];
}

export function deleteSession(id) {
  const list = getSessions().filter((entry) => Number(entry.session_id) !== Number(id) && Number(entry.id) !== Number(id));
  writeEntity(STORAGE_KEYS.sessions, list);
  return true;
}

export function getAnalytics() {
  const events = getEvents();
  const sessions = getSessions();
  const venues = getVenues();
  const speakers = getSpeakers();
  const attendance = getAttendance();
  const registrations = getRegistrations();
  const feedback = getFeedback();

  const totalSessions = sessions.length;
  const totalRegistrations = registrations.length;
  const totalAttendance = attendance.filter((item) => item.status === 'checked-in' || item.status === 'checked-out').length;
  const totalFeedback = feedback.length;
  const averageRating = feedback.length ? (feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedback.length).toFixed(1) : 0;

  const attendanceRate = totalRegistrations ? ((totalAttendance / totalRegistrations) * 100).toFixed(1) : 0;
  const noShowRate = totalRegistrations ? (((totalRegistrations - totalAttendance) / totalRegistrations) * 100).toFixed(1) : 0;

  const venueUtilization = venues.map((venue) => {
    const related = sessions.filter((session) => Number(session.venue_id) === Number(venue.venue_id));
    const expected = related.reduce((sum, session) => sum + Number(session.expectedAttendance || 0), 0);
    const utilization = Number(venue.capacity || 0) ? Math.min(100, Math.round((expected / Number(venue.capacity)) * 100)) : 0;
    return { venue_id: venue.venue_id, name: venue.name, utilization, expected, capacity: venue.capacity };
  });

  return {
    totalEvents: events.length,
    totalVenues: venues.length,
    totalSpeakers: speakers.length,
    totalSessions,
    totalRegistrations,
    totalAttendance,
    attendanceRate,
    noShowRate,
    averageRating,
    totalFeedback,
    venueUtilization,
  };
}

export function getAdminOverview() {
  const analytics = getAnalytics();
  const conflicts = detectConflicts();
  return {
    totalEvents: analytics.totalEvents,
    totalVenues: analytics.totalVenues,
    totalSpeakers: analytics.totalSpeakers,
    totalSessions: analytics.totalSessions,
    upcomingSessions: getSessions().filter((session) => new Date(session.start_time) > new Date()).length,
    confirmedSessions: getSessions().filter((session) => session.status === 'scheduled').length,
    venueConflicts: conflicts.venueConflicts.length,
    speakerConflicts: conflicts.speakerConflicts.length,
    averageVenueUtilization: venueUtilizationAverage(analytics.venueUtilization),
    totalRegisteredAttendees: analytics.totalRegistrations,
  };
}

function venueUtilizationAverage(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  const average = rows.reduce((sum, row) => sum + Number(row.utilization || 0), 0) / rows.length;
  return Number(average.toFixed(1));
}

// Technician Management
export function getTechnicians() {
  return readEntity(STORAGE_KEYS.technicians, SAMPLE_TECHNICIANS);
}

export function createTechnician(payload) {
  const list = getTechnicians();
  const techId = nextId(list, 'technician_id');
  const record = {
    id: techId,
    technician_id: techId,
    name: payload.name || 'Untitled Technician',
    skills: Array.isArray(payload.skills) ? payload.skills : [],
    experience: payload.experience || '1 year',
    availability: payload.availability || 'Available',
    phone: payload.phone || '',
    email: payload.email || '',
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.technicians, list);
  return record;
}

export function updateTechnician(id, payload) {
  const list = getTechnicians();
  const index = list.findIndex((tech) => Number(tech.technician_id) === Number(id) || Number(tech.id) === Number(id));
  if (index === -1) return null;
  list[index] = { ...list[index], ...payload };
  writeEntity(STORAGE_KEYS.technicians, list);
  return list[index];
}

// Incident Management
function buildIncidentAiAnalysis(incident = {}) {
  const text = `${incident.title || ''} ${incident.description || ''} ${incident.category || ''} ${incident.location || ''}`.toLowerCase();
  const hasSecurity = /(security|unauthorized|restricted|backstage|access|badge|barricade|intruder)/i.test(text);
  const hasMedical = /(medical|injury|first aid|emergency|ambulance|health)/i.test(text);
  const hasAudioVisual = /(microphone|audio|av|speaker|projector|screen|video|display|sound|lighting|visual)/i.test(text);
  const hasRegistration = /(registration|check-in|checkin|qr|scanner|badge|attendee|pass)/i.test(text);
  const hasCrowd = /(crowd|queue|overflow|capacity|stampede|congestion|traffic)/i.test(text);
  const hasMinorVenue = /(chair|seat|damaged|broken|repair|worn|table|furniture)/i.test(text);
  const hasVenue = /(venue|room|hall|layout|lighting|temperature)/i.test(text);
  const hasSpeaker = /(speaker|keynote|podium|stage|panel)/i.test(text);
  const hasElectrical = /(electrical|power|outage|socket|breaker|circuit|lighting)/i.test(text);
  const hasTransport = /(transport|parking|shuttle|bus|traffic|road)/i.test(text);
  const hasSponsorship = /(sponsor|booth|vendor|exhibitor|branding|stand)/i.test(text);

  let category = 'Other';
  if (hasSecurity) category = 'Security';
  else if (hasMedical) category = 'Medical';
  else if (hasAudioVisual) category = 'Audio/Visual';
  else if (hasRegistration) category = 'Registration';
  else if (hasCrowd) category = 'Crowd Management';
  else if (hasVenue) category = 'Venue';
  else if (hasSpeaker) category = 'Speaker';
  else if (hasElectrical) category = 'Electrical';
  else if (hasTransport) category = 'Transport';
  else if (hasSponsorship) category = 'Sponsorship';
  else if (incident.category) category = String(incident.category).trim() || 'Other';

  let severity = 'LOW';
  if (hasSecurity || hasMedical) severity = 'CRITICAL';
  else if (hasAudioVisual || hasSpeaker || hasRegistration || hasElectrical) severity = 'HIGH';
  else if (hasCrowd || hasTransport) severity = 'MEDIUM';
  else if (hasVenue && hasMinorVenue) severity = 'LOW';
  else if (hasVenue) severity = 'MEDIUM';

  const priority = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';
  const riskLevel = severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'HIGH' : severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';

  const actionMap = {
    'Audio/Visual': ['Check the active audio or video source and confirm the signal path.', 'Swap to backup equipment or a fallback microphone if available.', 'Escalate to AV support and keep the session team updated on recovery status.'],
    Security: ['Verify the access point and identify the unauthorized individual.', 'Notify security operations and isolate the affected restricted area.', 'Keep a brief log for admin review and event safety follow-up.'],
    Medical: ['Provide immediate first-aid support and isolate the affected area if needed.', 'Notify the medical response team and keep the attendee or staff member comfortable.', 'Capture event details for admin review and follow-up documentation.'],
    Registration: ['Check scanner connectivity, network state, and recent registration sync status.', 'Use an alternate check-in method while the primary system is unavailable.', 'Notify registration operations and track the impact on attendee flow.'],
    'Crowd Management': ['Assess crowd density and redirect attendees away from the affected zone.', 'Coordinate with floor staff to maintain safe movement and queue flow.', 'Notify operations leads if the issue affects capacity or staffing.'],
    Venue: ['Inspect the affected room, furniture, or safety condition immediately.', 'Apply a temporary workaround if the issue impacts attendee comfort or access.', 'Record the repair need and notify venue operations for follow-up.'],
    Speaker: ['Coordinate with the speaker and stage crew to maintain continuity.', 'Switch to a backup presenter setup if the issue affects the session flow.', 'Keep the stage operations lead informed of the latest recovery action.'],
    Electrical: ['Check the affected power path, breaker, or equipment source before proceeding.', 'Keep the zone clear until electrical safety is confirmed.', 'Escalate to facilities and provide an operational update to event leads.'],
    Transport: ['Confirm the transport issue and update attendees or staff with the latest guidance.', 'Coordinate with the transport or venue lead for rerouting or backup support.', 'Record the disruption and keep operations on the latest status.'],
    Sponsorship: ['Check the sponsor booth, signage, or delivery issue with the event team.', 'Coordinate with the sponsor contact if booth operations are affected.', 'Keep the admin informed if the issue affects the sponsor experience.'],
    Other: ['Inspect the affected area and determine whether the issue blocks event operations.', 'Notify the appropriate on-site team for immediate support.', 'Document the status and keep the admin updated.'],
  };

  const staffMap = {
    'Audio/Visual': 'AV / Technical Support',
    Security: 'Security Operations',
    Medical: 'Medical Response Team',
    Registration: 'Registration Support',
    'Crowd Management': 'Operations & Floor Management',
    Venue: 'Venue Operations',
    Speaker: 'Stage Operations',
    Electrical: 'Facilities & Electrical Team',
    Transport: 'Logistics & Transport Team',
    Sponsorship: 'Sponsor Relations Team',
    Other: 'General Operations Support',
  };

  return {
    category,
    severity,
    priority,
    riskLevel,
    summary: `The incident involving ${incident.title || 'the reported issue'} may ${severity === 'LOW' ? 'have a limited operational impact.' : severity === 'MEDIUM' ? 'affect part of the event operations.' : severity === 'HIGH' ? 'create a significant disruption to the event flow.' : 'pose an immediate risk to event continuity or attendee safety.'}`,
    recommendedActions: actionMap[category] || actionMap.Other,
    recommendedStaffType: staffMap[category] || 'General Operations Support',
    escalationRecommendation: severity === 'CRITICAL' || severity === 'HIGH' ? 'YES' : 'NO',
    escalationReason: severity === 'CRITICAL' || severity === 'HIGH' ? 'The incident affects a key operational area or has elevated safety risk.' : 'The issue appears manageable with the assigned on-site support team.',
    explanation: severity === 'LOW' ? 'The issue appears localized and contains limited operational risk.' : severity === 'MEDIUM' ? 'The incident affects part of the event experience and should be actively monitored.' : severity === 'HIGH' ? 'The issue impacts a key operational area and may disrupt the event experience for many attendees.' : 'The problem creates a major operational or safety risk and may require immediate escalation.',
    analyzedAt: new Date().toISOString(),
  };
}

export function analyzeIncident(id) {
  const list = getIncidents();
  const index = list.findIndex((inc) => Number(inc.incident_id) === Number(id) || Number(inc.id) === Number(id));
  if (index === -1) return { ok: false, message: 'Incident not found.' };

  const incident = list[index];
  const analysis = buildIncidentAiAnalysis(incident);
  incident.ai_analysis = analysis;
  incident.updated_at = new Date().toISOString();

  const timeline = Array.isArray(incident.timeline) ? [...incident.timeline] : [];
  const entry = { action: 'AI Analysis Generated', actor: 'AI Incident Agent', timestamp: new Date().toISOString(), description: `${analysis.category} • ${analysis.priority} priority • ${analysis.recommendedStaffType}` };
  const existingIndex = timeline.findIndex((item) => String(item.action || '').trim() === 'AI Analysis Generated');
  if (existingIndex >= 0) timeline[existingIndex] = entry;
  else timeline.push(entry);
  incident.timeline = timeline;

  list[index] = incident;
  writeEntity(STORAGE_KEYS.incidents, list);
  return { ok: true, analysis, incident };
}

export function getIncidents() {
  return readEntity(STORAGE_KEYS.incidents, SAMPLE_INCIDENTS);
}

export function getUserIncidents(userEmail) {
  if (!userEmail) return [];
  const incidents = getIncidents();
  return incidents.filter((inc) => String(inc.user_email).toLowerCase() === String(userEmail).toLowerCase());
}

export function getStaffIncidents(staffIdOrEmail) {
  if (!staffIdOrEmail && staffIdOrEmail !== 0) return [];
  const incidents = getIncidents();
  const value = String(staffIdOrEmail).trim();
  return incidents.filter((inc) => {
    const directId = Number(inc.assigned_staff_id ?? inc.assigned_technician_id ?? 0);
    const directEmail = String(inc.assigned_staff_email ?? inc.assigned_technician_email ?? '').toLowerCase();
    return directId === Number(staffIdOrEmail) || directEmail === value.toLowerCase() || String(inc.assigned_staff_name || '').toLowerCase() === value.toLowerCase();
  });
}

export function createIncident(payload) {
  const list = getIncidents();
  const incId = nextId(list, 'incident_id');
  const now = new Date().toISOString();
  const record = {
    id: incId,
    incident_id: incId,
    title: payload.title || 'Untitled Incident',
    description: payload.description || '',
    category: payload.category || 'General',
    priority: payload.priority || 'MEDIUM',
    status: payload.status || 'NEW',
    location: payload.location || 'N/A',
    user_email: payload.user_email || 'user@example.com',
    user_name: payload.user_name || 'User',
    assigned_technician_id: payload.assigned_technician_id || null,
    assigned_technician_name: payload.assigned_technician_name || null,
    created_at: now,
    updated_at: now,
  };
  list.push(record);
  writeEntity(STORAGE_KEYS.incidents, list);

  try {
    notifyUsers([{
      title: `New Incident Raised: ${record.title}`,
      message: `Incident #${record.incident_id} (${record.category} - ${record.priority}) reported by ${record.user_name}.`,
      type: 'alert',
      recipient_email: 'admin@eventai.local',
      recipient_role: 'admin'
    }]);
  } catch (e) {
    // Ignore notification error
  }

  return record;
}

export function updateIncident(id, payload) {
  const list = getIncidents();
  const index = list.findIndex((inc) => Number(inc.incident_id) === Number(id) || Number(inc.id) === Number(id));
  if (index === -1) return null;

  const updated = {
    ...list[index],
    ...payload,
    updated_at: new Date().toISOString()
  };

  list[index] = updated;
  writeEntity(STORAGE_KEYS.incidents, list);

  if (payload.status && payload.status !== list[index].status && list[index].user_email) {
    try {
      notifyUsers([{
        title: `Incident #${updated.incident_id} Status Updated`,
        message: `Your incident "${updated.title}" status changed to ${updated.status}.`,
        type: 'info',
        recipient_email: updated.user_email,
        recipient_role: 'user'
      }]);
    } catch (e) {
      // Ignore
    }
  }

  return updated;
}

export function deleteIncident(id) {
  const list = getIncidents().filter((inc) => Number(inc.incident_id) !== Number(id) && Number(inc.id) !== Number(id));
  writeEntity(STORAGE_KEYS.incidents, list);
  return true;
}

// AI Incident Agent Logic
export function recommendTechnician(incident = {}) {
  const technicians = getTechnicians();
  const { title = '', description = '', category = '', priority = '' } = incident;

  const searchText = `${title} ${description} ${category}`.toLowerCase();

  const ranked = technicians.map((tech) => {
    let score = 0;
    const skills = Array.isArray(tech.skills) ? tech.skills : [];

    // 1. Category / skill match
    const categoryMatch = category && skills.some(s => s.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(s.toLowerCase()));
    if (categoryMatch) score += 40;

    const matchedSkills = skills.filter(skill => searchText.includes(skill.toLowerCase()));
    score += matchedSkills.length * 15;

    // 2. Experience score
    const years = parseInt(tech.experience) || 0;
    score += years * 3;

    // 3. Availability score
    if (String(tech.availability).toLowerCase() === 'available') {
      score += 25;
    } else if (String(tech.availability).toLowerCase() === 'on-duty') {
      score += 10;
    }

    const matchedSkillList = [...new Set([...(categoryMatch ? [category] : []), ...matchedSkills])];

    let reasonParts = [];
    if (matchedSkillList.length > 0) {
      reasonParts.push(`Matching Skills: ${matchedSkillList.join(', ')}`);
    } else {
      reasonParts.push(`General Technical Support`);
    }
    reasonParts.push(`Experience: ${tech.experience}`);
    reasonParts.push(`Status: ${tech.availability}`);

    return {
      technician: tech,
      score,
      reason: reasonParts.join(' | ')
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  const top = ranked[0] || null;

  return {
    recommended: top ? top.technician : null,
    matchScore: top ? top.score : 0,
    matchReason: top ? top.reason : 'No matching technician found.',
    alternatives: ranked.slice(1).map(r => ({ technician: r.technician, score: r.score, reason: r.reason }))
  };
}

export { STORAGE_KEYS, SAMPLE_DATA, SAMPLE_EVENTS, SAMPLE_VENUES, SAMPLE_SPEAKERS, SAMPLE_SESSIONS, SAMPLE_NOTIFICATIONS, SAMPLE_TECHNICIANS, SAMPLE_INCIDENTS };

export function getLocalDataApi() {
  return {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getVenues,
    createVenue,
    updateVenue,
    deleteVenue,
    getSpeakers,
    createSpeaker,
    updateSpeaker,
    deleteSpeaker,
    getSessions,
    createSession,
    updateSession,
    deleteSession,
    checkVenueAvailability,
    checkSpeakerAvailability,
    recommendVenues,
    recommendSpeakers,
    optimizeVenue,
    detectConflicts,
    getRegistrations,
    createRegistration,
    getAttendance,
    recordAttendance,
    getFeedback,
    submitFeedback,
    getNotifications,
    notifyUsers,
    getAnalytics,
    getAdminOverview,
    initializeLocalData,
    getTechnicians,
    createTechnician,
    updateTechnician,
    getIncidents,
    getUserIncidents,
    createIncident,
    updateIncident,
    deleteIncident,
    recommendTechnician,
  };
}
