class RetryManager {
    static async executeWithRetry(taskFunction, maxRetries = 3, backoffMs = 1000) {
        let attempt = 0;
        let lastError = null;

        while (attempt < maxRetries) {
            attempt++;
            try {
                const result = await taskFunction();
                if (result && result.success) {
                    return { ...result, retryAttempts: attempt - 1 };
                }
                lastError = new Error(result?.error || 'Task execution unsuccessful');
            } catch (err) {
                lastError = err;
            }

            if (attempt < maxRetries) {
                const delay = backoffMs * Math.pow(1.5, attempt - 1);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        return {
            success: false,
            status: 'FAILED',
            retryAttempts: attempt - 1,
            error: lastError ? String(lastError.message || lastError) : 'Max retries exceeded',
        };
    }
}

module.exports = RetryManager;
