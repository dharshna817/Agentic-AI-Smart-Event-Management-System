import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'

const conversation = [
  {
    role: 'ai',
    text: "👋 Hey! I'm EventAI Assistant. Ready to help you register and learn about the event! What would you like to know?",
    options: ['Tell me about the event', 'How do I register?', 'What are the eligibility criteria?', 'Where is the venue?'],
  },
]

const responses = {
  'Tell me about the event': {
    text: "🎉 **TechFest 2025** is a flagship technology and innovation event bringing together developers, designers, and entrepreneurs! It features:\n\n• 🎤 Keynote speakers from top tech companies\n• 💻 Hands-on workshops and hackathons\n• 🤝 Networking sessions\n• 🏆 Innovation awards\n\nDate: September 15–17, 2025\nVenue: Convention Centre, Tech City",
    options: ['How do I register?', 'What is the fee?', 'Show me the schedule'],
  },
  'How do I register?': {
    text: "📝 Registering is super easy! Here's how:\n\n1. Click **'Register Now'** button\n2. Fill in your personal details (name, email, phone)\n3. Add your professional info (college/company, skills)\n4. Choose your dietary & accessibility preferences\n5. Submit and get your **QR code instantly!**\n\nThe whole process takes under 2 minutes! 🚀",
    options: ['What details are needed?', 'Is there a fee?', 'Register now!'],
  },
  'What are the eligibility criteria?': {
    text: "✅ **Eligibility Criteria:**\n\n• Students (undergraduate, postgraduate, PhD)\n• Working professionals in tech\n• Entrepreneurs and startup founders\n• Age: 18 years and above\n• Any nationality welcome\n\nNo specific skill level required — all are welcome! 🌟",
    options: ['How do I register?', 'What is the fee?'],
  },
  'Where is the venue?': {
    text: "📍 **Venue Details:**\n\nTech Innovation Convention Centre\n42 Innovation Boulevard,\nTech City, TC 560001\n\n🚇 Metro: Tech City Station (5 min walk)\n🚌 Bus: Routes 15, 22, 40\n🚗 Parking: Available at Lot B & C\n\nA venue map will be emailed upon registration!",
    options: ['How do I register?', 'What is the schedule?'],
  },
  'What is the fee?': {
    text: "💳 **Registration Fees:**\n\n• 🎓 Students: ₹299 (Early Bird: ₹199)\n• 💼 Professionals: ₹599 (Early Bird: ₹399)\n• 🚀 Startups: ₹899 (includes 2 passes)\n\nEarly bird ends August 31, 2025!\n\n✅ Includes: Entry, meals, kit, certificate",
    options: ['How do I register?', 'What payment methods?'],
  },
  'Show me the schedule': {
    text: "📅 **Event Schedule:**\n\n**Day 1 (Sep 15)**\n• 9AM Opening Ceremony\n• 10AM Keynote: Future of AI\n• 2PM Workshops begin\n\n**Day 2 (Sep 16)**\n• Hackathon begins (24hrs)\n• Networking dinner\n\n**Day 3 (Sep 17)**\n• Project demos\n• Award ceremony\n• Closing keynote",
    options: ['How do I register?', 'Where is the venue?'],
  },
  'What details are needed?': {
    text: "📋 **Required Information:**\n\n👤 Personal: Name, Email, Phone, Age, Gender\n🏫 Academic/Work: College/Company, Department, Occupation\n📍 Location: City\n💡 Professional: Skills, Interests, LinkedIn\n🆘 Emergency Contact\n🍽️ Dietary Preference\n♿ Accessibility Requirements\n\nAll data is securely stored and used only for event management.",
    options: ['How do I register?', 'Is my data safe?'],
  },
  'Is my data safe?': {
    text: "🔒 **Absolutely! Data Security:**\n\n• AES-256 encryption for all stored data\n• GDPR compliant data handling\n• No third-party data sharing\n• You can request data deletion anytime\n• SSL/TLS for all data transmission\n\nYour privacy is our priority! 🛡️",
    options: ['How do I register?'],
  },
  'What payment methods?': {
    text: "💰 **Payment Methods Accepted:**\n\n• UPI (Google Pay, PhonePe, Paytm)\n• Net Banking\n• Credit/Debit Cards (Visa, Mastercard, RuPay)\n• International: PayPal\n\nInstant payment confirmation and receipt via email!",
    options: ['How do I register?'],
  },
  'Register now!': {
    text: "🚀 Awesome! Let me take you to the registration form right away! Just click the button below and you'll be registered in under 2 minutes with your unique QR code!",
    options: ['Register now!'],
    action: '/register',
  },
  'Is there a fee?': {
    text: "💳 **Registration Fees:**\n\n• 🎓 Students: ₹299 (Early Bird: ₹199)\n• 💼 Professionals: ₹599 (Early Bird: ₹399)\n\nEarly bird ends August 31, 2025!",
    options: ['How do I register?', 'What payment methods?'],
  },
}

function formatText(text) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
      )}
      <br />
    </span>
  ))
}

export default function AIRegistrationAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(conversation)
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = (text) => {
    setMessages(prev => [...prev, { role: 'user', text }])
    setTyping(true)
    setTimeout(() => {
      const resp = responses[text] || {
        text: "I'm not sure about that, but I'd love to help! Try asking about registration, venue, schedule, eligibility, or fees. 😊",
        options: ['Tell me about the event', 'How do I register?', 'Where is the venue?'],
      }
      setMessages(prev => [...prev, { role: 'ai', text: resp.text, options: resp.options, action: resp.action }])
      setTyping(false)
    }, 900)
  }

  const handleInput = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 btn-primary rounded-full flex items-center justify-center shadow-2xl"
        style={{ display: open ? 'none' : 'flex' }}
      >
        <Bot size={26} className="text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-8 right-8 z-40 w-[380px] h-[580px] glass-dark rounded-3xl flex flex-col overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-900/40"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center glow-purple flex-shrink-0">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm flex items-center gap-2">
                  EventAI Assistant
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div className="text-slate-400 text-xs">Powered by AI • Always here to help</div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-slate-400 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    {msg.role === 'ai' && (
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles size={10} className="text-purple-400" />
                        <span className="text-purple-400 text-xs font-medium">EventAI</span>
                      </div>
                    )}
                    <div className={msg.role === 'ai' ? 'chatbot-message-ai' : 'chatbot-message-user'}>
                      <p className="text-slate-200 text-sm leading-relaxed">
                        {formatText(msg.text)}
                      </p>
                    </div>
                    {/* Quick reply options */}
                    {msg.role === 'ai' && msg.options && i === messages.length - 1 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => sendMessage(opt)}
                            className="text-xs px-3 py-1.5 glass border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 rounded-full transition-all"
                          >
                            {opt}
                          </button>
                        ))}
                        {msg.action && (
                          <a
                            href={msg.action}
                            className="text-xs px-4 py-1.5 btn-primary rounded-full font-semibold"
                          >
                            🚀 Go Register!
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="chatbot-message-ai">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleInput} className="p-3 border-t border-white/10 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 input-glass px-4 py-2.5 rounded-xl text-sm"
              />
              <button
                type="submit"
                className="w-10 h-10 btn-primary rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
