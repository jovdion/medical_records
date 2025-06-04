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
    redirecting: false,
    lastRedirect: null
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
    SESSION.lastRedirect = null;
}

function isLoginPage() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('login.html') || path.includes('register.html');
}

function safeRedirect(url) {
    // Prevent redirect if already redirecting
    if (SESSION.redirecting) {
        debugLog('Redirect already in progress, skipping');
        return;
    }
    
    // Prevent redirect loop
    const now = Date.now();
    if (SESSION.lastRedirect && (now - SESSION.lastRedirect) < 2000) {
        debugLog('Too many redirects, waiting...');
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
    SESSION.lastRedirect = now;
    debugLog('Redirecting to:', url);
    
    // Use replace for login/register redirects, use assign for others
    if (url.includes('login.html') || url.includes('register.html') || 
        currentPath.includes('login.html') || currentPath.includes('register.html')) {
        window.location.replace(url);
    } else {
        window.location.assign(url);
    }
}

// Check authentication status
async function checkAuth() {
    // Prevent multiple simultaneous checks
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

        // Handle login/register pages
        if (isOnLoginPage) {
            if (SESSION.token && SESSION.user) {
                try {
                    // Quick token verification before redirecting
                    const verifyResult = await makeApiRequest(CONFIG.ENDPOINTS.VERIFY);
                    debugLog('Token valid, redirecting to dashboard');
                    safeRedirect('dashboard.html');
                } catch (err) {
                    debugLog('Invalid token on login page, clearing session');
                    clearSession();
                }
            }
            return;
        }

        // For all other pages, verify token if exists
        if (SESSION.token && SESSION.user) {
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
        } else {
            // No token or user, redirect to login
            debugLog('No token or user found, redirecting to login');
            clearSession();
            if (!isOnLoginPage) {
                safeRedirect('login.html');
            }
        }

    } catch (err) {
        errorLog('Error during auth check:', err);
        clearSession();
        if (!isOnLoginPage) {
            safeRedirect('login.html');
        }
    } finally {
        SESSION.isCheckingAuth = false;
    }
}

// Initialize auth check on page load with delay
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkAuth, 500);
});

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
