// initScripts.js
document.addEventListener('DOMContentLoaded', () => {
    const cleanupFunctions = new Set();

    const handleError = (error, source) => {
        console.error(`Error in ${source}:`, error);
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.textContent = `Error in ${source}: ${error.message}`;
            resultDiv.className = 'error';
            resultDiv.classList.remove('hidden');
        }
    };

    // Check if CONFIG is available
    if (!window.CONFIG) {
        handleError(new Error('CONFIG is not defined'), 'Initialization');
        return;
    }

    try {
        AWS.config.update({
            maxRetries: CONFIG.AWS.REQUEST_CONFIG.maxRetries,
            retryDelayOptions: {
                base: CONFIG.AWS.REQUEST_CONFIG.retryDelay
            },
            httpOptions: {
                timeout: CONFIG.AWS.REQUEST_CONFIG.timeout
            }
        });
    } catch (error) {
        handleError(error, 'AWS Config');
    }

    // Initialize UI Controller
    let uiController;
    try {
        uiController = new UIController();
        window.uiController = uiController;
        cleanupFunctions.add(() => {
            if (uiController?.cleanup) {
                uiController.cleanup();
            }
        });
    } catch (error) {
        handleError(error, 'UI Controller');
    }

    // Cleanup on unload
    window.addEventListener('unload', () => {
        cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        });
    });

    if (CONFIG.ENV.DEBUG) {
        console.log('Application initialized with config:', CONFIG);
    }
});