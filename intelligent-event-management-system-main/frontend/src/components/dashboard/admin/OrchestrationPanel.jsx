import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitMerge,
    Play,
    CheckCircle2,
    AlertTriangle,
    Clock,
    ShieldAlert,
    Users,
    Building2,
    Bell,
    Activity,
    ChevronRight,
    RefreshCw,
    Info,
    Check,
    X,
    Layers,
    Sparkles,
    ArrowRight,
    Eye,
    FileText,
} from 'lucide-react';

const API_BASE = 'http://localhost:5002/api/orchestration';

export default function OrchestrationPanel() {
    const [workflows, setWorkflows] = useState([]);
    const [agents, setAgents] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [activeTab, setActiveTab] = useState('pipelines'); // 'pipelines', 'approvals', 'agents', 'audit'

    const fetchData = async () => {
        try {
            setLoading(true);
            const [wfRes, agentRes, metricsRes, auditRes] = await Promise.all([
                fetch(`${API_BASE}/workflows`),
                fetch(`${API_BASE}/agents`),
                fetch(`${API_BASE}/metrics`),
                fetch(`${API_BASE}/audit`),
            ]);

            const wfData = await wfRes.json();
            const agentData = await agentRes.json();
            const metricsData = await metricsRes.json();
            const auditData = await auditRes.json();

            setWorkflows(Array.isArray(wfData) ? wfData : []);
            setAgents(Array.isArray(agentData) ? agentData : []);
            setMetrics(metricsData);
            setAuditLogs(Array.isArray(auditData) ? auditData : []);

            if (wfData.length > 0 && !selectedWorkflow) {
                // Fetch full details of first workflow
                fetchWorkflowDetail(wfData[0].workflowId);
            }
        } catch (err) {
            console.error('Failed to fetch orchestration data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkflowDetail = async (workflowId) => {
        try {
            const res = await fetch(`${API_BASE}/workflows/${workflowId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedWorkflow(data);
            }
        } catch (err) {
            console.error('Failed to fetch workflow detail:', err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 4000);
        return () => clearInterval(interval);
    }, []);

    const handleTriggerScenario = async (triggerType, customPayload = {}) => {
        try {
            setTriggering(true);
            const res = await fetch(`${API_BASE}/triggers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    triggerType,
                    source: 'admin-dashboard-demo',
                    eventId: 1,
                    metadata: {
                        speakerId: 1,
                        speakerName: 'Dr. Sarah Chen',
                        sessionId: 1,
                        sessionName: 'Opening Keynote: Agentic AI Systems',
                        expectedAttendees: 180,
                        ...customPayload,
                    },
                }),
            });

            const data = await res.json();
            if (data.success && data.workflow) {
                await fetchData();
                fetchWorkflowDetail(data.workflow.workflowId);
            }
        } catch (err) {
            console.error('Trigger scenario error:', err);
        } finally {
            setTriggering(false);
        }
    };

    const handleApprove = async (workflowId, approvalId) => {
        try {
            const res = await fetch(`${API_BASE}/workflows/${workflowId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvalId,
                    approvedBy: 'Admin (Event Manager)',
                    note: 'Approved reschedule to Innovation Hall B at 14:00',
                }),
            });
            if (res.ok) {
                await fetchData();
                fetchWorkflowDetail(workflowId);
            }
        } catch (err) {
            console.error('Approval failed:', err);
        }
    };

    const handleReject = async (workflowId, approvalId) => {
        try {
            const res = await fetch(`${API_BASE}/workflows/${workflowId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvalId,
                    rejectedBy: 'Admin (Event Manager)',
                    reason: 'Schedule conflict with parallel session',
                }),
            });
            if (res.ok) {
                await fetchData();
                fetchWorkflowDetail(workflowId);
            }
        } catch (err) {
            console.error('Rejection failed:', err);
        }
    };

    const filteredWorkflows = workflows.filter((wf) => {
        if (filterStatus === 'ALL') return true;
        return wf.status === filterStatus;
    });

    const pendingApprovalsList = workflows.filter((wf) => wf.status === 'WAITING_FOR_APPROVAL');

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'RUNNING':
                return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse';
            case 'WAITING_FOR_APPROVAL':
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'ESCALATED':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'FAILED':
            case 'CANCELLED':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const getAgentIcon = (agentId) => {
        switch (agentId) {
            case 'speaker-agent':
                return <Users size={16} className="text-cyan-400" />;
            case 'intelligence-agent':
                return <Sparkles size={16} className="text-purple-400" />;
            case 'venue-agent':
                return <Building2 size={16} className="text-amber-400" />;
            case 'registration-agent':
                return <CheckCircle2 size={16} className="text-emerald-400" />;
            case 'incident-agent':
                return <ShieldAlert size={16} className="text-rose-400" />;
            case 'notification-agent':
                return <Bell size={16} className="text-blue-400" />;
            case 'sponsorship-agent':
                return <Layers size={16} className="text-indigo-400" />;
            default:
                return <GitMerge size={16} className="text-purple-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl text-white shadow-lg shadow-purple-500/20">
                                <GitMerge size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                    Central Agent Orchestrator
                                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                        Milestone 4 — Autonomous Multi-Agent Layer
                                    </span>
                                </h1>
                                <p className="text-slate-400 text-sm mt-1">
                                    Centralized event-driven coordinator managing agent dependencies, task sequencing, fallback retries, and human-in-the-loop approvals.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchData}
                            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 transition flex items-center gap-2 text-xs font-medium"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh Stream
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>Total Workflows</span>
                        <GitMerge size={16} className="text-purple-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">
                        {metrics?.totalWorkflows || 0}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Event-driven pipelines</div>
                </div>

                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>Active / Running</span>
                        <Activity size={16} className="text-cyan-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-cyan-400 flex items-center gap-2">
                        {metrics?.activeWorkflows || 0}
                        {(metrics?.activeWorkflows || 0) > 0 && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Currently executing</div>
                </div>

                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>Registered Agents</span>
                        <Users size={16} className="text-emerald-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-400">
                        {metrics?.agentCount || 7} ACTIVE
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">100% operational readiness</div>
                </div>

                <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between bg-amber-500/5">
                    <div className="flex items-center justify-between text-amber-300 text-xs font-medium">
                        <span>Pending Approvals</span>
                        <Clock size={16} className="text-amber-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-amber-400">
                        {pendingApprovalsList.length}
                    </div>
                    <div className="text-[10px] text-amber-300/70 mt-1">Human-in-the-loop required</div>
                </div>

                <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>Success Rate</span>
                        <CheckCircle2 size={16} className="text-purple-400" />
                    </div>
                    <div className="mt-2 text-2xl font-bold text-purple-400">
                        {metrics?.successRate || 100}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Completed execution rate</div>
                </div>
            </div>

            {/* Interactive Trigger Demo Scenarios */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Play size={18} className="text-cyan-400" />
                            Demo Business Scenario Launcher
                        </h3>
                        <p className="text-xs text-slate-400">
                            Trigger a real-time business event to demonstrate central agent routing, dependency resolution, human approvals, and dashboard updates.
                        </p>
                    </div>
                    <div className="text-xs text-slate-500 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-white/5">
                        Event-Driven Architecture Engine
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Primary Demo Scenario: Speaker Cancellation */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-purple-900/30 to-slate-900 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden"
                    >
                        <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                            PRIMARY DEMO
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm mb-1">
                                <Users size={16} />
                                Speaker Cancellation
                            </div>
                            <p className="text-slate-400 text-xs line-clamp-2 mb-3">
                                Speaker cancels keynote. Triggering Speaker → Intelligence → Venue → Attendee → Incident → Alert → Approval → Complete.
                            </p>
                        </div>
                        <button
                            onClick={() => handleTriggerScenario('speaker.cancelled')}
                            disabled={triggering}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-medium text-xs shadow-md transition flex items-center justify-center gap-2"
                        >
                            {triggering ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                            Trigger Speaker Scenario
                        </button>
                    </motion.div>

                    {/* Secondary Scenario 1: Venue Failure */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/80 border border-white/10 hover:border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm mb-1">
                                <Building2 size={16} />
                                Venue Failure
                            </div>
                            <p className="text-slate-400 text-xs line-clamp-2 mb-3">
                                Venue room failure detected. Recommends room relocation, calculates attendee impact, creates P1 incident & alert.
                            </p>
                        </div>
                        <button
                            onClick={() => handleTriggerScenario('venue.unavailable')}
                            disabled={triggering}
                            className="w-full py-2 bg-slate-800 hover:bg-cyan-950/50 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 rounded-lg font-medium text-xs transition flex items-center justify-center gap-2"
                        >
                            <Play size={14} />
                            Trigger Venue Scenario
                        </button>
                    </motion.div>

                    {/* Secondary Scenario 2: Registration Spike */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/80 border border-white/10 hover:border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm mb-1">
                                <Activity size={16} />
                                Registration Surge Spike
                            </div>
                            <p className="text-slate-400 text-xs line-clamp-2 mb-3">
                                Sudden 300% registration surge detected. Registration agent & Intelligence recalculates venue utilization & staff allocation.
                            </p>
                        </div>
                        <button
                            onClick={() => handleTriggerScenario('registration.spike')}
                            disabled={triggering}
                            className="w-full py-2 bg-slate-800 hover:bg-emerald-950/50 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 rounded-lg font-medium text-xs transition flex items-center justify-center gap-2"
                        >
                            <Play size={14} />
                            Trigger Spike Scenario
                        </button>
                    </motion.div>

                    {/* Secondary Scenario 3: Critical Incident */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/80 border border-white/10 hover:border-rose-500/30 rounded-xl p-4 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm mb-1">
                                <ShieldAlert size={16} />
                                Critical Security Incident
                            </div>
                            <p className="text-slate-400 text-xs line-clamp-2 mb-3">
                                Critical incident raised. Incident agent assigns security response team, triggers escalation & operational alert.
                            </p>
                        </div>
                        <button
                            onClick={() => handleTriggerScenario('incident.created')}
                            disabled={triggering}
                            className="w-full py-2 bg-slate-800 hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-lg font-medium text-xs transition flex items-center justify-center gap-2"
                        >
                            <Play size={14} />
                            Trigger Critical Scenario
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Human Approval Center Banner (if pending approvals exist) */}
            <AnimatePresence>
                {pendingApprovalsList.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 rounded-2xl p-6 shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg animate-bounce">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-300">
                                    Human Approval Center — Action Required ({pendingApprovalsList.length})
                                </h3>
                                <p className="text-xs text-amber-200/70">
                                    The Agent Orchestrator has paused executing high-impact actions pending explicit admin decision.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pendingApprovalsList.map((wf) => {
                                const approval = wf.approvals?.find((a) => a.status === 'PENDING') || wf.context?.venueOptions;
                                return (
                                    <div
                                        key={wf.workflowId}
                                        className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 space-y-3"
                                    >
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-amber-400">{wf.workflowId}</span>
                                            <span className="text-slate-400">{wf.triggerType}</span>
                                        </div>

                                        <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-white/5">
                                            <div className="font-semibold text-white mb-1">Proposed Resolution:</div>
                                            <div>Venue: <span className="text-cyan-300">{wf.context?.venueOptions?.recommendedVenueName || 'Innovation Hall B'}</span></div>
                                            <div>Time: <span className="text-cyan-300">{wf.context?.venueOptions?.availableTime || '14:00 - 15:30'}</span></div>
                                            <div>Impacted Attendees: <span className="text-amber-400">{wf.context?.attendeeImpact?.affectedAttendeesCount || 180}</span></div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                onClick={() => handleApprove(wf.workflowId)}
                                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                            >
                                                <Check size={14} />
                                                Approve Action
                                            </button>
                                            <button
                                                onClick={() => handleReject(wf.workflowId)}
                                                className="flex-1 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                            >
                                                <X size={14} />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <button
                    onClick={() => setActiveTab('pipelines')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'pipelines'
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                        : 'text-slate-400 hover:bg-white/5'
                        }`}
                >
                    <GitMerge size={16} />
                    Workflow Pipelines ({workflows.length})
                </button>

                <button
                    onClick={() => setActiveTab('agents')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'agents'
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                        : 'text-slate-400 hover:bg-white/5'
                        }`}
                >
                    <Users size={16} />
                    Agent Registry ({agents.length})
                </button>

                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'audit'
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                        : 'text-slate-400 hover:bg-white/5'
                        }`}
                >
                    <FileText size={16} />
                    Live Audit Trail Stream ({auditLogs.length})
                </button>
            </div>

            {/* TAB 1: WORKFLOW PIPELINES & VISUAL TIMELINE */}
            {activeTab === 'pipelines' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Workflow List */}
                    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-white">Workflows</h3>
                            <div className="flex gap-1">
                                {['ALL', 'RUNNING', 'WAITING_FOR_APPROVAL', 'COMPLETED'].map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setFilterStatus(st)}
                                        className={`text-[10px] px-2 py-1 rounded-md font-medium transition ${filterStatus === st
                                            ? 'bg-purple-600 text-white'
                                            : 'text-slate-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {st === 'WAITING_FOR_APPROVAL' ? 'APPROVAL' : st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {filteredWorkflows.map((wf) => {
                                const isSelected = selectedWorkflow?.workflowId === wf.workflowId;
                                return (
                                    <motion.div
                                        key={wf.workflowId}
                                        onClick={() => fetchWorkflowDetail(wf.workflowId)}
                                        whileHover={{ x: 2 }}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition ${isSelected
                                            ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-900/20'
                                            : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                                {wf.workflowId}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadgeClass(wf.status)}`}>
                                                    {wf.status}
                                                </span>
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(wf.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-300 font-medium">
                                            Event: <span className="text-cyan-300">{wf.triggerType}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                                            <span>Tasks: {wf.tasks?.length || 5}</span>
                                            <span className="text-purple-400 flex items-center gap-1">
                                                View DAG <ChevronRight size={12} />
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {filteredWorkflows.length === 0 && (
                                <div className="text-center py-8 text-slate-500 text-xs">
                                    No workflows matching filter.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Visual DAG Execution Timeline */}
                    <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
                        {selectedWorkflow ? (
                            <div>
                                {/* Workflow Detail Banner */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-white">
                                                {selectedWorkflow.workflowId}
                                            </h2>
                                            <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusBadgeClass(selectedWorkflow.status)}`}>
                                                {selectedWorkflow.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Trigger: <span className="text-cyan-300 font-mono">{selectedWorkflow.triggerType}</span> | Source: <span className="text-purple-300">{selectedWorkflow.triggerSource}</span>
                                        </p>
                                    </div>

                                    {selectedWorkflow.status === 'WAITING_FOR_APPROVAL' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApprove(selectedWorkflow.workflowId)}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                            >
                                                <Check size={14} /> Approve Action
                                            </button>
                                            <button
                                                onClick={() => handleReject(selectedWorkflow.workflowId)}
                                                className="px-4 py-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                            >
                                                <X size={14} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* VISUAL DAG PIPELINE FLOW GRAPH */}
                                <div className="mb-8">
                                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Layers size={14} className="text-cyan-400" />
                                        Multi-Agent Execution Pipeline Flow (DAG)
                                    </h4>

                                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950/80 p-5 rounded-2xl border border-white/10 overflow-x-auto">
                                        {/* Trigger Event Node */}
                                        <div className="flex flex-col items-center text-center p-3 bg-slate-900 border border-purple-500/30 rounded-xl min-w-[120px]">
                                            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg mb-1">
                                                <Play size={16} />
                                            </div>
                                            <span className="text-[11px] font-bold text-purple-300">{selectedWorkflow.triggerType}</span>
                                            <span className="text-[9px] text-slate-500">EVENT TRIGGER</span>
                                        </div>

                                        <ArrowRight size={18} className="text-purple-500 hidden md:block" />

                                        {/* Agent Sequence Nodes */}
                                        {(selectedWorkflow.tasks || [
                                            { agentId: 'speaker-agent', status: 'COMPLETED' },
                                            { agentId: 'intelligence-agent', status: 'COMPLETED' },
                                            { agentId: 'venue-agent', status: 'COMPLETED' },
                                            { agentId: 'registration-agent', status: 'COMPLETED' },
                                            { agentId: 'incident-agent', status: 'COMPLETED' },
                                            { agentId: 'notification-agent', status: 'COMPLETED' },
                                        ]).map((task, idx) => (
                                            <React.Fragment key={task.taskId || idx}>
                                                <div className="flex flex-col items-center text-center p-3 bg-slate-900 border border-white/10 rounded-xl min-w-[130px] relative">
                                                    <div className="p-2 bg-slate-800 rounded-lg mb-1">
                                                        {getAgentIcon(task.agentId)}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-white capitalize">
                                                        {task.agentId?.replace('-agent', '')}
                                                    </span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded mt-1 border ${getStatusBadgeClass(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                </div>

                                                {idx < (selectedWorkflow.tasks?.length || 6) - 1 && (
                                                    <ArrowRight size={16} className="text-slate-600 hidden md:block" />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>

                                {/* Task Execution Details Table */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                        <FileText size={14} className="text-purple-400" />
                                        Agent Tasks & Output Payload
                                    </h4>

                                    <div className="space-y-2">
                                        {(selectedWorkflow.tasks || []).map((task) => (
                                            <div
                                                key={task.taskId}
                                                className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2 font-bold text-white">
                                                        {getAgentIcon(task.agentId)}
                                                        <span>{task.agentId}</span>
                                                        <span className="text-[10px] text-slate-500 font-mono">({task.taskId})</span>
                                                    </div>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusBadgeClass(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                </div>

                                                {task.output && (
                                                    <div className="bg-slate-900/90 p-3 rounded-lg border border-white/5 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto">
                                                        <pre>{JSON.stringify(task.output, null, 2)}</pre>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 text-slate-500 text-xs">
                                Select a workflow from the left to view its visual DAG pipeline and task execution output.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: AGENT REGISTRY */}
            {activeTab === 'agents' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                        <div
                            key={agent.agentId}
                            className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4 relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-slate-800 rounded-xl">
                                        {getAgentIcon(agent.agentId)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                                        <span className="text-[10px] text-slate-400 font-mono">{agent.agentId}</span>
                                    </div>
                                </div>

                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                                    {agent.status}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2">{agent.description}</p>

                            <div className="space-y-2">
                                <div className="text-[11px] text-slate-400 font-semibold">Capabilities:</div>
                                <div className="flex flex-wrap gap-1">
                                    {agent.capabilities?.map((cap) => (
                                        <span
                                            key={cap}
                                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5"
                                        >
                                            {cap}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/5">
                                <div>Timeout: <span className="text-white">{agent.timeout}ms</span></div>
                                <div>Retries: <span className="text-white">{agent.retryPolicy?.maxRetries}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: LIVE AUDIT TRAIL STREAM */}
            {activeTab === 'audit' && (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText size={16} className="text-cyan-400" />
                        Chronological Audit Log Stream
                    </h3>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto font-mono text-xs">
                        {auditLogs.map((log) => (
                            <div
                                key={log.auditId || log.id}
                                className="bg-slate-950 p-3 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span className="font-bold text-purple-400">{log.workflowId}</span>
                                    <span className="text-cyan-300 font-semibold">{log.action}</span>
                                    {log.agentId && <span className="text-slate-400 font-normal">[{log.agentId}]</span>}
                                </div>

                                <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusBadgeClass(log.status)}`}>
                                    {log.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
