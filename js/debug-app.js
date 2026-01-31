// Debug Version - Minimal JavaScript to identify errors
console.log('🔍 Debug script loading...');

// Check if required elements exist
function checkElements() {
    const elements = {
        'loginScreen': document.getElementById('loginScreen'),
        'appContainer': document.getElementById('appContainer'),
        'dashboardTab': document.getElementById('dashboard-tab'),
        'vehiclesTab': document.getElementById('vehicles-tab'),
        'driversTab': document.getElementById('drivers-tab'),
        'tripsTab': document.getElementById('trips-tab')
    };
    
    console.log('📋 Element check:');
    Object.entries(elements).forEach(([id, element]) => {
        console.log(`   ${id}: ${element ? '✅ Found' : '❌ Missing'}`);
    });
    
    return elements;
}

// Simple initialization
function initializeApp() {
    try {
        console.log('🚀 Starting debug initialization...');
        
        const elements = checkElements();
        
        // Hide login, show app
        if (elements.loginScreen) {
            elements.loginScreen.classList.add('hidden');
            console.log('✅ Login screen hidden');
        }
        
        if (elements.appContainer) {
            elements.appContainer.classList.remove('hidden');
            console.log('✅ App container shown');
        }
        
        // Show dashboard tab by default
        const dashboardTab = document.getElementById('dashboard-tab');
        if (dashboardTab) {
            dashboardTab.click();
            console.log('✅ Dashboard tab activated');
        }
        
        console.log('✅ Debug initialization completed successfully');
        
    } catch (error) {
        console.error('❌ Debug initialization failed:', error);
        alert(`JavaScript Error: ${error.message}`);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('❌ JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno
    });
});

console.log('✅ Debug script loaded successfully');
