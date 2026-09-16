import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  { q: 'How long does registration take?', a: 'Registration takes less than 2 minutes! Fill in 16 fields across 5 easy steps and instantly receive your unique QR code and event pass via email.' },
  { q: 'Can I register for multiple events?', a: 'Yes! Each event gets its own registration with a unique QR code and Registration ID. Your profile details auto-fill for faster subsequent registrations.' },
  { q: 'What happens if I lose my QR code?', a: 'No worries! Login to your account, go to My Registrations, and re-download your QR code anytime. We also store it securely in our database.' },
  { q: 'Can organizers import registrations from Google Forms?', a: 'Absolutely! EventAI supports importing from Google Forms, Microsoft Forms, Excel, CSV files, and any API. AI automatically detects and merges duplicate entries.' },
  { q: 'How accurate is the AI attendance prediction?', a: 'Our AI attendance prediction has shown 94–98% accuracy based on historical data, registration patterns, and behavioral signals. It improves as more events are processed.' },
  { q: 'Is the platform accessible for people with disabilities?', a: 'Yes! The platform is WCAG 2.1 AA compliant. Registration includes an accessibility requirements field so organizers can ensure a comfortable experience for all attendees.' },
  { q: 'How are reminders sent?', a: 'Reminders are sent automatically via Email, SMS, and WhatsApp at 7 days, 3 days, 1 day, 2 hours, and 30 minutes before the event. All communication can be customized.' },
  { q: 'Can I check in attendees without internet?', a: 'Yes! The QR check-in scanner works offline and syncs attendance data when the connection is restored. Perfect for venues with limited connectivity.' },
]

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <section id="faq" className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="badge inline-flex items-center gap-2 mb-4">
            <HelpCircle size={12} />
            FAQ
          </div>
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Everything you need to know about EventAI. Can't find the answer? Ask our AI assistant!
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`glass rounded-2xl overflow-hidden border transition-all duration-300 ${
                openIdx === i ? 'border-purple-500/40 glow-purple' : 'border-white/[0.06]'
              }`}
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left group"
              >
                <span className={`font-medium text-sm md:text-base transition-colors ${
                  openIdx === i ? 'text-purple-300' : 'text-white group-hover:text-purple-300'
                }`}>
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: openIdx === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex-shrink-0 ml-4 ${openIdx === i ? 'text-purple-400' : 'text-slate-500'}`}
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
