const { readEntity, writeEntity, nextId } = require('../lib/jsonStore');

const TASKS_FILE = 'workflow_tasks';

const TASK_STATES = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    RETRYING: 'RETRYING',
    WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
    TIMED_OUT: 'TIMED_OUT',
};

function getTasks() {
    const data = readEntity(TASKS_FILE, []);
    return Array.isArray(data) ? data : [];
}

function saveTasks(tasks) {
    writeEntity(TASKS_FILE, tasks);
}

function getTasksForWorkflow(workflowId) {
    const tasks = getTasks();
    return tasks.filter((t) => String(t.workflowId) === String(workflowId));
}

function createTask({ workflowId, agentId, sequenceOrder = 1, dependencies = [], input = {} }) {
    const tasks = getTasks();
    const taskId = `TASK-${String(nextId(tasks, 'id')).padStart(3, '0')}`;

    const newTask = {
        id: nextId(tasks, 'id'),
        taskId,
        workflowId,
        agentId,
        sequenceOrder,
        dependencies,
        status: TASK_STATES.PENDING,
        input,
        output: null,
        retryCount: 0,
        maxRetries: 3,
        confidence: null,
        startedAt: null,
        completedAt: null,
        error: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
}

function updateTaskState(taskId, status, payload = {}) {
    const tasks = getTasks();
    const index = tasks.findIndex((t) => String(t.taskId) === String(taskId) || String(t.id) === String(taskId));
    if (index === -1) return null;

    const current = tasks[index];
    current.status = status;
    current.updatedAt = new Date().toISOString();

    if (status === TASK_STATES.RUNNING && !current.startedAt) {
        current.startedAt = new Date().toISOString();
    }

    if (payload.output) current.output = payload.output;
    if (payload.confidence !== undefined) current.confidence = payload.confidence;
    if (payload.error) current.error = payload.error;
    if (payload.retryCount !== undefined) current.retryCount = payload.retryCount;

    if ([TASK_STATES.COMPLETED, TASK_STATES.FAILED, TASK_STATES.TIMED_OUT].includes(status)) {
        current.completedAt = new Date().toISOString();
    }

    tasks[index] = current;
    saveTasks(tasks);
    return current;
}

module.exports = {
    TASK_STATES,
    getTasks,
    getTasksForWorkflow,
    createTask,
    updateTaskState,
};
