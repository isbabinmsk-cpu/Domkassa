/**
 * Main Entry Point - FinancePRO Application
 */

import { app } from './modules/app.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('FinancePRO v2.0.0 initializing...');
    app.init();
    console.log('FinancePRO initialized successfully!');
});
