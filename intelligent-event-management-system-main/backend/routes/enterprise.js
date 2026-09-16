const express = require('express')
const { registerUser, loginUser, getVenues, recommendVenue, createVenueBooking, getSpeakers, createSpeakerSession, getSessions, getAnalytics, getNotifications, createNotification, scanAttendance, getQrPass } = require('../controllers/enterpriseController')

const router = express.Router()

router.post('/auth/register', registerUser)
router.post('/auth/login', loginUser)
router.get('/venues', getVenues)
router.get('/venues/recommend', recommendVenue)
router.post('/venues/book', createVenueBooking)
router.get('/speakers', getSpeakers)
router.post('/sessions', createSpeakerSession)
router.get('/sessions', getSessions)
router.get('/analytics', getAnalytics)
router.get('/notifications', getNotifications)
router.post('/notifications', createNotification)
router.post('/attendance/scan', scanAttendance)
router.get('/participant-qr', getQrPass)

module.exports = router
