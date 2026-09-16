const express = require('express');
const {
    handleTriggerWorkflow,
    handleGetWorkflows,
    handleGetWorkflowById,
    handleGetWorkflowTasks,
    handleApproveWorkflow,
    handleRejectWorkflow,
    handleCancelWorkflow,
    handleGetAgents,
    handleGetAuditLog,
    handleGetMetrics,
} = require('../orchestration/orchestrationController');

const router = express.Router();

router.post('/triggers', handleTriggerWorkflow);
router.post('/workflows', handleTriggerWorkflow);
router.get('/workflows', handleGetWorkflows);
router.get('/workflows/:workflowId', handleGetWorkflowById);
router.get('/workflows/:workflowId/tasks', handleGetWorkflowTasks);
router.post('/workflows/:workflowId/approve', handleApproveWorkflow);
router.post('/workflows/:workflowId/reject', handleRejectWorkflow);
router.post('/workflows/:workflowId/cancel', handleCancelWorkflow);
router.get('/agents', handleGetAgents);
router.get('/audit/:workflowId', handleGetAuditLog);
router.get('/audit', handleGetAuditLog);
router.get('/metrics', handleGetMetrics);

module.exports = router;
