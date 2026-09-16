-- Milestone 2: Venue & Speaker Operations
-- Execute this after creating the users table

-- Venues Table
CREATE TABLE IF NOT EXISTS venues (
  venue_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(500),
  capacity INT NOT NULL,
  facilities JSON,
  equipment JSON,
  status ENUM('available', 'unavailable', 'maintenance') DEFAULT 'available',
  hourly_rate DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Venue Bookings Table
CREATE TABLE IF NOT EXISTS venue_bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  venue_id INT NOT NULL,
  event_id INT,
  session_id INT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
  booked_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
  INDEX idx_venue_time (venue_id, start_time, end_time),
  INDEX idx_status (status)
);

-- Speakers Table
CREATE TABLE IF NOT EXISTS speakers (
  speaker_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  expertise JSON,
  bio TEXT,
  availability JSON,
  photo_url VARCHAR(500),
  rating DECIMAL(3, 2),
  status ENUM('active', 'inactive', 'unavailable') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Speaker Sessions Table
CREATE TABLE IF NOT EXISTS speaker_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  speaker_id INT NOT NULL,
  session_id INT,
  session_name VARCHAR(255),
  event_id INT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('assigned', 'confirmed', 'completed', 'cancelled') DEFAULT 'assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (speaker_id) REFERENCES speakers(speaker_id),
  INDEX idx_speaker_time (speaker_id, start_time, end_time),
  INDEX idx_status (status)
);

-- QR Pass Table
CREATE TABLE IF NOT EXISTS participant_qr (
  qr_id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT,
  participant_email VARCHAR(255),
  event_id INT,
  qr_token VARCHAR(255) UNIQUE NOT NULL,
  qr_data LONGTEXT,
  status ENUM('active', 'used', 'expired') DEFAULT 'active',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  INDEX idx_token (qr_token),
  INDEX idx_email (participant_email)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  participant_id INT,
  participant_email VARCHAR(255),
  event_id INT,
  session_id INT,
  venue_id INT,
  check_in DATETIME,
  check_out DATETIME,
  qr_token VARCHAR(255),
  status ENUM('checked-in', 'checked-out', 'no-show', 'pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
  INDEX idx_email (participant_email),
  INDEX idx_event (event_id),
  INDEX idx_status (status)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT,
  recipient_email VARCHAR(255),
  recipient_role ENUM('admin', 'user') DEFAULT 'user',
  type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (recipient_email),
  INDEX idx_read (is_read)
);

-- Sessions Table (for storing event sessions)
CREATE TABLE IF NOT EXISTS sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT,
  session_name VARCHAR(255) NOT NULL,
  description TEXT,
  venue_id INT,
  speaker_id INT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  capacity INT,
  status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
  FOREIGN KEY (speaker_id) REFERENCES speakers(speaker_id),
  INDEX idx_event (event_id),
  INDEX idx_time (start_time, end_time)
);

-- Analytics View (Venue Utilization)
CREATE VIEW venue_utilization AS
SELECT 
  v.venue_id,
  v.name,
  v.capacity,
  COUNT(vb.booking_id) as total_bookings,
  SUM(TIMESTAMPDIFF(HOUR, vb.start_time, vb.end_time)) as total_hours_booked,
  (SUM(TIMESTAMPDIFF(HOUR, vb.start_time, vb.end_time)) / (v.capacity * 24)) * 100 as utilization_percentage
FROM venues v
LEFT JOIN venue_bookings vb ON v.venue_id = vb.venue_id AND vb.status = 'confirmed'
GROUP BY v.venue_id;

-- Analytics View (Speaker Workload)
CREATE VIEW speaker_workload AS
SELECT 
  s.speaker_id,
  s.name,
  COUNT(ss.id) as total_sessions,
  SUM(TIMESTAMPDIFF(HOUR, ss.start_time, ss.end_time)) as total_hours,
  AVG(s.rating) as avg_rating
FROM speakers s
LEFT JOIN speaker_sessions ss ON s.speaker_id = ss.speaker_id AND ss.status != 'cancelled'
GROUP BY s.speaker_id;

-- Create initial data (optional sample venues)
INSERT INTO venues (name, location, capacity, facilities, equipment, status) VALUES
('Grand Auditorium', 'Building A, Floor 3', 500, '["WiFi", "Projector", "Sound System", "AC"]', '["Microphone", "Speakers", "Screen"]', 'available'),
('Innovation Lab', 'Building B, Floor 2', 150, '["WiFi", "Whiteboard", "AC"]', '["Laptop", "Projector"]', 'available'),
('Conference Room A', 'Building C, Floor 1', 50, '["WiFi", "AC"]', '["Table", "Chairs"]', 'available'),
('Banquet Hall', 'Building D', 300, '["WiFi", "AC", "Catering", "Parking"]', '["Sound System", "Stage"]', 'available')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create sample speakers
INSERT INTO speakers (name, email, phone, expertise, bio, status) VALUES
('Dr. John Smith', 'john@example.com', '9876543210', '["AI", "ML", "Cloud Computing"]', 'Expert in AI and ML with 15 years experience', 'active'),
('Jane Doe', 'jane@example.com', '9876543211', '["Web Development", "React", "Node.js"]', 'Full stack developer and technical speaker', 'active'),
('Mike Johnson', 'mike@example.com', '9876543212', '["DevOps", "Kubernetes", "AWS"]', 'Cloud infrastructure specialist', 'active')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
