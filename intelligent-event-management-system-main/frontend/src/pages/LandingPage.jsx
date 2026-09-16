import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import EventHighlights from '../components/EventHighlights'
import TestimonialsSection from '../components/TestimonialsSection'
import FAQSection from '../components/FAQSection'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'
import AIRegistrationAssistant from '../components/AIRegistrationAssistant'

const pageVariants = {
  initial: { opacity: 0 },
  in:      { opacity: 1 },
  out:     { opacity: 0 },
}

export default function LandingPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.4 }}
      className="relative z-10 min-h-screen"
    >
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <EventHighlights />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
      <AIRegistrationAssistant />
    </motion.div>
  )
}
