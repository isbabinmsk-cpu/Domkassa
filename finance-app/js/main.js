// Main entry point - initializes the application
import { app } from './modules/app.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
