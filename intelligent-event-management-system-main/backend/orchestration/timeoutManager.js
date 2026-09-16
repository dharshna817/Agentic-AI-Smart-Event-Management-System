class TimeoutManager {
    static async executeWithTimeout(taskPromiseFn, timeoutMs = 5000) {
        let timer;
        const timeoutPromise = new Promise((resolve) => {
            timer = setTimeout(() => {
                resolve({
                    success: false,
                    status: 'TIMED_OUT',
                    error: `Agent task timed out after ${timeoutMs}ms`,
                });
            }, timeoutMs);
        });

        try {
            const result = await Promise.race([taskPromiseFn(), timeoutPromise]);
            clearTimeout(timer);
            return result;
        } catch (err) {
            clearTimeout(timer);
            return {
                success: false,
                status: 'FAILED',
                error: String(err.message || err),
            };
        }
    }
}

module.exports = TimeoutManager;
