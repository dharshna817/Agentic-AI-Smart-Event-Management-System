import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function SponsorProposalSuccessPage() {
  const navigate = useNavigate()
  const { proposalId } = useParams()
  const saved = JSON.parse(localStorage.getItem('eventai_last_proposal') || '{}')

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col pt-20">
      <div className="max-w-3xl mx-auto w-full px-4 py-12">
        <div className="glass rounded-3xl p-8 border border-emerald-500/30 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
            <CheckCircle2 size={32} className="text-emerald-300" />
          </div>

          <h1 className="font-orbitron text-3xl font-bold text-white">Proposal Submitted Successfully</h1>
          <p className="mt-3 text-slate-300">Your sponsorship proposal has been submitted to the event administrator for review.</p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-left space-y-3 text-sm text-slate-300">
            <div className="flex justify-between gap-6">
              <span>Proposal ID</span>
              <span className="text-white font-semibold">{proposalId || saved.proposalId || 'SP-0000-0000'}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Event</span>
              <span className="text-white font-semibold">{saved.eventName || 'Tech Innovation Summit'}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Package</span>
              <span className="text-white font-semibold">{saved.packageName || 'Platinum'}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Amount</span>
              <span className="text-white font-semibold">₹{Number(saved.amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Status</span>
              <span className="text-amber-300 font-semibold">Pending Review</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => navigate('/sponsor/dashboard')}
              className="btn-primary rounded-xl px-5 py-3 text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                localStorage.setItem('eventai_sponsor_tab', 'My Proposals')
                navigate('/sponsor/dashboard')
              }}
              className="btn-ghost rounded-xl px-5 py-3 text-xs font-semibold border border-white/10 text-slate-200 inline-flex items-center justify-center gap-2"
            >
              View My Proposals <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
