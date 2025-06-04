import { CONFIG, makeApiRequest } from './js/utils.js';

// Debug logging function
function debugLog(...args) {
    if (window.DEBUG) {
        console.log('[Debug]', new Date().toISOString(), ...args);
    }
}

// Error logging function
function errorLog(...args) {
    console.error('[Error]', new Date().toISOString(), ...args);
}

// Show status message function
function showStatusMessage(message, type = 'info') {
    debugLog('Showing status message:', { message, type });
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = type;
        statusMessage.style.display = 'block';
        
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }
}

// Session management
const SESSION = {
    token: null,
    user: null,
    lastCheck: null,
    isCheckingAuth: false,
    redirecting: false
};

function loadSession() {
    try {
        SESSION.token = localStorage.getItem('token');
        const userStr = localStorage.getItem('currentUser');
        SESSION.user = userStr ? JSON.parse(userStr) : null;
        SESSION.lastCheck = Date.now();
    } catch (err) {
        errorLog('Error loading session:', err);
        clearSession();
    }
}

function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    SESSION.token = null;
    SESSION.user = null;
    SESSION.lastCheck = null;
}

function isLoginPage() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('login.html') || path.includes('register.html');
}

function safeRedirect(url) {
    if (SESSION.redirecting) {
        debugLog('Redirect already in progress, skipping');
        return;
    }
    
    const currentPath = window.location.pathname.toLowerCase();
    const targetPath = url.toLowerCase();
    
    // Prevent redirect to the same page
    if (currentPath.includes(targetPath)) {
        debugLog('Already on target page, skipping redirect');
        return;
    }
    
    SESSION.redirecting = true;
    debugLog('Redirecting to:', url);
    window.location.replace(url);
}

// Check authentication status
async function checkAuth() {
    if (SESSION.isCheckingAuth || SESSION.redirecting) {
        debugLog('Auth check or redirect already in progress, skipping');
        return;
    }

    try {
        SESSION.isCheckingAuth = true;
        debugLog('Starting auth check');

        loadSession();
        
        const currentPath = window.location.pathname.toLowerCase();
        const isOnLoginPage = isLoginPage();
        debugLog('Auth state:', { 
            path: currentPath,
            isLoginPage: isOnLoginPage,
            hasToken: !!SESSION.token,
            hasUser: !!SESSION.user,
            lastCheck: SESSION.lastCheck
        });

        // If on index.html, redirect to login or dashboard
        if (currentPath.endsWith('index.html') || 
            currentPath === '/' || 
            currentPath === '') {
            debugLog('On index page, redirecting...');
            if (SESSION.token && SESSION.user) {
                safeRedirect('dashboard.html');
            } else {
                safeRedirect('login.html');
            }
            return;
        }

        // Handle login/register pages
        if (isOnLoginPage) {
            if (SESSION.token && SESSION.user) {
                debugLog('Authenticated user on login/register page, redirecting to dashboard');
                safeRedirect('dashboard.html');
            }
            return;
        }

        // Handle other pages
        if (!SESSION.token || !SESSION.user) {
            debugLog('Unauthenticated user on protected page, redirecting to login');
            clearSession();
            safeRedirect('login.html');
            return;
        }

        // Optional: Verify token is still valid with backend
        try {
            const verifyResult = await makeApiRequest(CONFIG.ENDPOINTS.VERIFY);
            debugLog('Token verification successful:', verifyResult);
        } catch (err) {
            errorLog('Token verification failed:', err);
            clearSession();
            if (!isOnLoginPage) {
                safeRedirect('login.html');
            }
            return;
        }

    } catch (err) {
        errorLog('Error during auth check:', err);
        clearSession();
        if (!isLoginPage()) {
            safeRedirect('login.html');
        }
    } finally {
        SESSION.isCheckingAuth = false;
    }
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);

// Fetch patients
async function fetchPatients() {
    try {
        const patients = await makeApiRequest(CONFIG.ENDPOINTS.PATIENTS);
        return patients;
    } catch (error) {
        errorLog('Error fetching patients:', error);
        showStatusMessage('Failed to load patients data', 'error');
        throw error;
    }
}

// Fetch doctors
async function fetchDoctors() {
    try {
        const doctors = await makeApiRequest(CONFIG.ENDPOINTS.DOCTORS);
        return doctors;
    } catch (error) {
        errorLog('Error fetching doctors:', error);
        showStatusMessage('Failed to load doctors data', 'error');
        throw error;
    }
}

// Export functions and constants
export {
    debugLog,
    errorLog,
    showStatusMessage,
    SESSION,
    loadSession,
    clearSession,
    isLoginPage,
    safeRedirect,
    checkAuth,
    fetchPatients,
    fetchDoctors
};
