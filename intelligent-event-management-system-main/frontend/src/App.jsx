import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import MagicCursor from './components/MagicCursor'
import ParticleBackground from './components/ParticleBackground'
import LandingPage from './pages/LandingPage'
import RegistrationPage from './pages/RegistrationPage'
import SuccessPage from './pages/SuccessPage'
import DashboardPage from './pages/DashboardPage'
import CheckinPage from './pages/CheckinPage'
import AuthPage from './pages/AuthPage'
import AuthRegisterPage from './pages/AuthRegisterPage'
import AdminDashboard from './pages/AdminDashboard'
import UserDashboard from './pages/UserDashboard'
import VenueAgentPage from './pages/VenueAgentPage'
import SpeakerAgentPage from './pages/SpeakerAgentPage'
import SponsorLoginPage from './pages/SponsorLoginPage'
import SponsorRegisterPage from './pages/SponsorRegisterPage'
import SponsorDashboardPage from './pages/SponsorDashboardPage'
import SponsorBrowseEventsPage from './pages/SponsorBrowseEventsPage'
import SponsorEventDetailsPage from './pages/SponsorEventDetailsPage'
import SponsorPackageSelectionPage from './pages/SponsorPackageSelectionPage'
import SponsorCustomizeRequirementsPage from './pages/SponsorCustomizeRequirementsPage'
import SponsorReviewRequirementsPage from './pages/SponsorReviewRequirementsPage'
import SponsorProposalSuccessPage from './pages/SponsorProposalSuccessPage'

function ProtectedRoute({ children, allowedRole }) {
  let user = null
  try {
    user = JSON.parse(localStorage.getItem('eventai_user') || 'null')
  } catch (error) {
    user = null
  }

  if (!user) {
    if (allowedRole === 'sponsor') {
      return <Navigate to="/sponsor/login" replace />
    }
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    const redirectTarget = user.role === 'admin'
      ? '/admin/dashboard'
      : user.role === 'sponsor'
        ? '/sponsor/dashboard'
        : '/user/dashboard'
    return <Navigate to={redirectTarget} replace />
  }

  return children
}

export default function App() {
  const location = useLocation()
  return (
    <>
      <MagicCursor />
      <ParticleBackground />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthRegisterPage />} />
          <Route path="/event/register" element={<RegistrationPage />} />
          <Route path="/success/:id" element={<SuccessPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/user/dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="/venue-agent" element={<VenueAgentPage />} />
          <Route path="/speaker-agent" element={<SpeakerAgentPage />} />
          <Route path="/sponsor/login" element={<SponsorLoginPage />} />
          <Route path="/sponsor/register" element={<SponsorRegisterPage />} />
          <Route path="/sponsor/dashboard" element={<ProtectedRoute allowedRole="sponsor"><SponsorDashboardPage /></ProtectedRoute>} />
          <Route path="/sponsor/events" element={<ProtectedRoute allowedRole="sponsor"><SponsorBrowseEventsPage /></ProtectedRoute>} />
          <Route path="/sponsor/events/:eventId" element={<ProtectedRoute allowedRole="sponsor"><SponsorEventDetailsPage /></ProtectedRoute>} />
          <Route path="/sponsor/events/:eventId/select-package/:packageId" element={<ProtectedRoute allowedRole="sponsor"><SponsorPackageSelectionPage /></ProtectedRoute>} />
          <Route path="/sponsor/events/:eventId/select-package/:packageId/customize" element={<ProtectedRoute allowedRole="sponsor"><SponsorCustomizeRequirementsPage /></ProtectedRoute>} />
          <Route path="/sponsor/events/:eventId/select-package/:packageId/review" element={<ProtectedRoute allowedRole="sponsor"><SponsorReviewRequirementsPage /></ProtectedRoute>} />
          <Route path="/sponsor/proposals/success/:proposalId" element={<ProtectedRoute allowedRole="sponsor"><SponsorProposalSuccessPage /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
