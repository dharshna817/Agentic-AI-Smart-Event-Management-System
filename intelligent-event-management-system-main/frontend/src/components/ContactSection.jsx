import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 1500))
    toast.success('Message sent! We\'ll get back to you within 24 hours.')
    setForm({ name: '', email: '', subject: '', message: '' })
    setSending(false)
  }

  return (
    <section id="contact" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="badge inline-flex items-center gap-2 mb-4">
            <MessageSquare size={12} />
            Contact Us
          </div>
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">
            Get In <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Have questions? We're here 24/7. Reach out and we'll respond faster than you can say "QR code".
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-6"
          >
            {[
              { icon: Mail, label: 'Email Us', value: 'hello@eventai.platform', color: 'text-purple-400', bg: 'from-purple-600 to-indigo-600' },
              { icon: Phone, label: 'Call Us', value: '+91 98765 43210', color: 'text-cyan-400', bg: 'from-cyan-600 to-blue-600' },
              { icon: MapPin, label: 'Office', value: '42 Innovation Blvd, Tech City', color: 'text-blue-400', bg: 'from-blue-600 to-indigo-600' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-5 flex items-center gap-4 group card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-slate-400 text-xs mb-0.5">{item.label}</div>
                  <div className={`${item.color} font-semibold text-sm`}>{item.value}</div>
                </div>
              </motion.div>
            ))}

            {/* Response time card */}
            <div className="glass-purple rounded-2xl p-5 text-center">
              <div className="font-orbitron text-3xl font-bold gradient-text mb-1">{'< 2hr'}</div>
              <div className="text-slate-400 text-sm">Average Response Time</div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-medium">Support Online Now</span>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.form
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="lg:col-span-3 glass rounded-2xl p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-slate-400 text-xs font-medium mb-2 block">Full Name</label>
                <input
                  required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full input-glass px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-2 block">Email Address</label>
                <input
                  required type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full input-glass px-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Subject</label>
              <input
                required value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we help?"
                className="w-full input-glass px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Message</label>
              <textarea
                required rows={5} value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us more..."
                className="w-full input-glass px-4 py-3 rounded-xl text-sm resize-none"
              />
            </div>
            <button
              type="submit" disabled={sending}
              className="w-full btn-primary py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Message
                </>
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  )
}
