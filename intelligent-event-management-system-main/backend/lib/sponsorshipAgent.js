const { readEntity, writeEntity, nextId } = require('./jsonStore')
const path = require('path')

const ANALYSIS_FILE = 'sponsorship_agent_analysis'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function budgetScoreFromProposal(proposal = {}) {
  const amount = Number(proposal.amount ?? 0)
  const packagePrice = Number(proposal.package_price ?? proposal.packagePrice ?? 0)
  const base = packagePrice > 0 ? (amount / packagePrice) * 100 : 100
  return clamp(Math.round(base), 0, 100)
}

function buildRiskFactors({ proposal = {}, sponsor = {}, event = {}, packageInfo = {} }) {
  const risks = []

  if (!proposal.booth_required && proposal.booth_preference && proposal.booth_preference !== 'Not Required') {
    risks.push('Booth request is not confirmed for a premium site requirement.')
  }

  if (Number(proposal.promotional_sessions ?? 0) > 3) {
    risks.push('High promotional engagement demand may increase activation overhead.')
  }

  if (proposal.special_requirements && proposal.special_requirements.length > 60) {
    risks.push('Custom requirements are detailed and may require operational coordination.')
  }

  if (sponsor && String(sponsor.status || '').toLowerCase() !== 'active') {
    risks.push('Sponsor status is not active, which can reduce confidence in delivery.')
  }

  if (event && event.status && String(event.status).toLowerCase() === 'completed') {
    risks.push('The selected event is already completed or closed for sponsorship.')
  }

  if (packageInfo && packageInfo.name && String(packageInfo.name).toLowerCase() === 'silver' && Number(proposal.amount ?? 0) > 250000) {
    risks.push('Package value appears larger than the selected tier suggests, which may require pricing review.')
  }

  return risks
}

function calculateSponsorScore({ proposal = {}, sponsor = {}, event = {}, packageInfo = {} }) {
  let score = 55

  if (sponsor && String(sponsor.status || '').toLowerCase() === 'active') score += 15
  else score -= 10

  if (proposal.booth_required) score += 10
  if (proposal.booth_preference && proposal.booth_preference !== 'Not Required') score += 5
  if (Array.isArray(proposal.branding_requirements) && proposal.branding_requirements.length > 0) score += 8
  if (Number(proposal.promotional_sessions ?? 0) > 0) score += 6
  if (proposal.special_requirements && String(proposal.special_requirements).trim().length > 0) score += 4

  const amountToPackage = budgetScoreFromProposal({ ...proposal, package_price: Number(packageInfo?.price ?? proposal.amount ?? 0) })
  score = score + Math.round((amountToPackage - 50) / 5)

  if (event && event.location) score += 3
  if (packageInfo && packageInfo.name) score += 4

  return clamp(Math.round(score), 0, 100)
}

function calculateReliabilityScore({ proposal = {}, sponsor = {}, packageInfo = {} }) {
  let score = 68

  if (sponsor && String(sponsor.status || '').toLowerCase() === 'active') score += 12
  if (packageInfo && Number(packageInfo.price ?? 0) > 0) score += 5
  if (proposal.booth_required) score += 6
  if (Number(proposal.promotional_sessions ?? 0) > 0) score += 4
  if (proposal.special_requirements && String(proposal.special_requirements).trim().length > 0) score += 4

  if (Number(proposal.amount ?? 0) > 1000000) score -= 10

  return clamp(Math.round(score), 0, 100)
}

function determineProposalRisk(sponsorScore) {
  if (sponsorScore >= 80) return 'Low'
  if (sponsorScore >= 60) return 'Medium'
  return 'High'
}

function determinePackageSuitability({ proposal = {}, packageInfo = {} }) {
  const amount = Number(proposal.amount ?? 0)
  const packagePrice = Number(packageInfo?.price ?? 0)

  if (!packagePrice) return 'Medium'
  const ratio = amount / packagePrice

  if (ratio >= 0.9 && ratio <= 1.2) return 'High'
  if (ratio >= 0.7 && ratio <= 1.5) return 'Medium'
  return 'Low'
}

function determineExpectedEngagement({ proposal = {} }) {
  const sessions = Number(proposal.promotional_sessions ?? 0)
  const branding = Array.isArray(proposal.branding_requirements) ? proposal.branding_requirements.length : 0

  if (sessions >= 2 || branding >= 2 || Boolean(proposal.booth_required)) return 'High'
  if (sessions >= 1 || branding >= 1) return 'Medium'
  return 'Low'
}

function determineRecommendation({ sponsorScore, proposalRisk, packageSuitability, expectedEngagement }) {
  if (proposalRisk === 'Low' && packageSuitability === 'High' && expectedEngagement === 'High') {
    return 'Suitable for Approval'
  }

  if (proposalRisk === 'Medium' || packageSuitability === 'Medium' || expectedEngagement === 'Medium') {
    return 'Review Carefully'
  }

  if (proposalRisk === 'High' && packageSuitability === 'Low') {
    return 'High Risk — Manual Review'
  }

  return 'Requires Negotiation'
}

function buildExplanation({ proposal = {}, sponsor = {}, event = {}, packageInfo = {}, sponsorScore, reliabilityScore, proposalRisk, packageSuitability, expectedEngagement, recommendation }) {
  const sponsorName = sponsor?.company_name || sponsor?.name || 'Sponsor'
  const eventName = event?.name || 'selected event'
  const packageName = packageInfo?.name || 'selected package'

  return `${sponsorName} submitted a ${packageName} sponsorship proposal for ${eventName}. The proposal has a sponsor score of ${sponsorScore}/100 and a reliability score of ${reliabilityScore}/100. The assessed risk is ${proposalRisk}, package suitability is ${packageSuitability}, and expected engagement is ${expectedEngagement}. Recommendation: ${recommendation}. This analysis is advisory only and does not approve or reject the proposal.`
}

function getStoredAnalyses() {
  const entries = readEntity(ANALYSIS_FILE, [])
  return Array.isArray(entries) ? entries : []
}

function writeStoredAnalyses(entries) {
  writeEntity(ANALYSIS_FILE, Array.isArray(entries) ? entries : [])
}

function analyzeProposal({ proposal = {}, sponsor = {}, event = {}, packageInfo = {} } = {}) {
  const proposalId = String(proposal.proposal_id || proposal.id || 'SP-UNKNOWN').trim()
  const sponsorScore = calculateSponsorScore({ proposal, sponsor, event, packageInfo })
  const reliabilityScore = calculateReliabilityScore({ proposal, sponsor, packageInfo })
  const proposalRisk = determineProposalRisk(sponsorScore)
  const packageSuitability = determinePackageSuitability({ proposal, packageInfo })
  const expectedEngagement = determineExpectedEngagement({ proposal })
  const riskFactors = buildRiskFactors({ proposal, sponsor, event, packageInfo })
  const recommendation = determineRecommendation({ sponsorScore, proposalRisk, packageSuitability, expectedEngagement })

  const analysis = {
    proposal_id: proposalId,
    sponsor_score: sponsorScore,
    reliability_score: reliabilityScore,
    proposal_risk: proposalRisk,
    package_suitability: packageSuitability,
    expected_engagement: expectedEngagement,
    risk_factors: riskFactors,
    recommendation,
    explanation: buildExplanation({
      proposal,
      sponsor,
      event,
      packageInfo,
      sponsorScore,
      reliabilityScore,
      proposalRisk,
      packageSuitability,
      expectedEngagement,
      recommendation,
    }),
    analyzed_at: new Date().toISOString(),
  }

  const analyses = getStoredAnalyses()
  const existingIndex = analyses.findIndex((item) => String(item.proposal_id) === proposalId)

  if (existingIndex >= 0) {
    analyses[existingIndex] = analysis
  } else {
    analyses.push(analysis)
  }

  writeStoredAnalyses(analyses)
  return analysis
}

function getProposalAnalysis(proposalId) {
  const analyses = getStoredAnalyses()
  return analyses.find((item) => String(item.proposal_id) === String(proposalId)) || null
}

module.exports = {
  ANALYSIS_FILE,
  analyzeProposal,
  getProposalAnalysis,
  getStoredAnalyses,
  writeStoredAnalyses,
  determineProposalRisk,
  determinePackageSuitability,
  determineExpectedEngagement,
  determineRecommendation,
}
