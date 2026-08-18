/**
 * Main Entry Point
 * Initializes the Finance App application
 */

import { app } from './modules/app.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init().catch(error => {
        console.error('Failed to initialize app:', error);
    });
});

// Export for potential external use
export { app };
