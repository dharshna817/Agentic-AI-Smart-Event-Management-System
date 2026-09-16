import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'
import {
  Download, Mail, Share2, Home, Calendar, MapPin,
  CheckCircle, Sparkles, QrCode, User, Clock
} from 'lucide-react'
import Navbar from '../components/Navbar'

export default function SuccessPage() {
  const { id } = useParams()
  const location = useLocation()
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const passRef = useRef(null)
  const formData = location.state?.formData || {}

  const regData = {
    registrationId: id,
    fullName: formData.fullName || 'Attendee',
    email: formData.email || 'attendee@email.com',
    event: 'TechFest 2025',
    date: 'September 15–17, 2025',
    venue: 'Tech Innovation Centre, Tech City',
    ...formData,
  }

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrPayload = JSON.stringify({
          id: regData.registrationId,
          name: regData.fullName,
          email: regData.email,
          event: regData.event,
        })
        const url = await QRCode.toDataURL(qrPayload, {
          width: 256,
          margin: 1,
          color: { dark: '#1a0a2e', light: '#ffffff' },
          errorCorrectionLevel: 'H',
        })
        setQrDataUrl(url)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    generateQR()
  }, [id])

  const downloadQR = () => {
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `EventPass-${id}.png`
    link.click()
    toast.success('QR code downloaded!')
  }

  const downloadPass = async () => {
    if (!passRef.current) return
    toast.loading('Generating PDF pass...')
    try {
      const canvas = await html2canvas(passRef.current, { scale: 2, backgroundColor: null, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85, 135] })
      pdf.addImage(imgData, 'PNG', 0, 0, 85, 135)
      pdf.save(`EventPass-${id}.pdf`)
      toast.dismiss()
      toast.success('Event pass downloaded!')
    } catch (err) {
      toast.dismiss()
      toast.error('Failed to generate PDF. Try downloading the QR image instead.')
    }
  }

  const share = async () => {
    if (navigator.share) {
      navigator.share({ title: 'My TechFest 2025 Pass', text: `I'm registered for TechFest 2025! ID: ${id}`, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative z-10 min-h-screen pt-24 pb-16 px-4"
    >
      <Navbar />

      <div className="max-w-lg mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 glow-cyan">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white mb-2">
            You're <span className="gradient-text">Registered!</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Your event pass and QR code are ready. Check your email for confirmation.
          </p>
        </motion.div>

        {/* Event Pass Card */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          ref={passRef}
          className="glass rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-900/40 mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(15,15,26,0.95), rgba(26,10,46,0.95))' }}
        >
          {/* Pass Header */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-cyan-700 p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)' }} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-white/60 text-xs font-medium mb-1">EVENT PASS</div>
                <div className="font-orbitron text-2xl font-bold text-white">TechFest 2025</div>
                <div className="text-cyan-200 text-xs mt-1">Powered by EventAI</div>
              </div>
              <Sparkles size={36} className="text-white/40" />
            </div>
          </div>

          {/* Pass Body */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* QR Code */}
              <div className="flex-shrink-0">
                {loading ? (
                  <div className="w-40 h-40 rounded-2xl shimmer" />
                ) : (
                  <motion.div
                    initial={{ scale: 0.3, rotateY: 90, opacity: 0 }}
                    animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
                    className="qr-container"
                  >
                    <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 rounded-lg" />
                  </motion.div>
                )}
              </div>

              {/* Attendee Details */}
              <div className="flex-1 space-y-3 text-sm">
                <div>
                  <div className="text-slate-500 text-xs">ATTENDEE</div>
                  <div className="text-white font-bold text-lg">{regData.fullName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">REGISTRATION ID</div>
                  <div className="font-orbitron text-purple-300 font-bold text-base tracking-wider">{id}</div>
                </div>
                {regData.occupation && (
                  <div>
                    <div className="text-slate-500 text-xs">ROLE</div>
                    <div className="text-slate-300">{regData.occupation}</div>
                  </div>
                )}
                {regData.collegeOrCompany && (
                  <div>
                    <div className="text-slate-500 text-xs">INSTITUTION</div>
                    <div className="text-slate-300 text-xs">{regData.collegeOrCompany}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="neon-line my-5" />

            {/* Event Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-500">DATE</div>
                  <div className="text-white">Sep 15–17, 2025</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-500">VENUE</div>
                  <div className="text-white">Tech Innovation Centre</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-500">TIME</div>
                  <div className="text-white">9:00 AM Daily</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <QrCode size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-500">CHECK-IN</div>
                  <div className="text-white">Scan at entry</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pass Footer */}
          <div className="px-6 py-3 border-t border-white/5 flex items-center gap-2">
            <div className="flex-1 flex gap-1">
              {Array(20).fill(0).map((_, i) => (
                <div key={i} className={`h-1 rounded-full flex-1 ${i % 3 === 0 ? 'bg-purple-600' : i % 3 === 1 ? 'bg-indigo-600' : 'bg-cyan-600'}`} />
              ))}
            </div>
            <span className="text-slate-600 text-xs font-mono ml-2">{id}</span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <button onClick={downloadQR} className="btn-primary py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 text-sm">
            <Download size={15} />
            Download QR
          </button>
          <button onClick={downloadPass} className="btn-ghost py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
            <Download size={15} />
            Download Pass
          </button>
          <button onClick={share} className="btn-ghost py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
            <Share2 size={15} />
            Share Pass
          </button>
          <Link to="/" className="btn-ghost py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
            <Home size={15} />
            Go Home
          </Link>
        </motion.div>

        {/* Info Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-2xl p-5 text-sm space-y-2"
        >
          <div className="text-white font-semibold mb-3 flex items-center gap-2">
            <Mail size={15} className="text-cyan-400" />
            What happens next?
          </div>
          {[
            '📧 Confirmation email sent to your inbox',
            '📱 QR code will be emailed in 5 minutes',
            '🔔 Automated reminders at 7 days, 3 days, 1 day before event',
            '✅ Present this QR code at the event entrance',
          ].map(note => (
            <div key={note} className="text-slate-400 text-xs">{note}</div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
