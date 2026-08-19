/**
 * Main Entry Point - FinancePRO Application
 */

import { app } from '../modules/app.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('FinancePRO v3.0.0 initializing...');
    
    // Check for required browser features
    if (!window.localStorage) {
        alert('Ваш браузер не поддерживает localStorage. Приложение может работать некорректно.');
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js не загружен. Проверьте подключение к интернету.');
    }
    
    app.init();
    console.log('FinancePRO initialized successfully!');
});
