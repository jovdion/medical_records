import { CONFIG, makeApiRequest, logDebug } from './js/utils.js';

// Debug logging function
function debugLog(...args) {
    logDebug('Debug', ...args);
}

// Error logging function
function errorLog(...args) {
    logDebug('Error', ...args);
}

// Show status message function
function showStatusMessage(message, type = 'info') {
    debugLog('Status Message', { message, type });
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
    lastRedirect: null,
    redirectCount: 0
};

function loadSession() {
    try {
        SESSION.token = localStorage.getItem('token');
        const userStr = localStorage.getItem('currentUser');
        SESSION.user = userStr ? JSON.parse(userStr) : null;
        SESSION.lastCheck = Date.now();
        debugLog('Session Loaded', {
            hasToken: !!SESSION.token,
            hasUser: !!SESSION.user,
            lastCheck: SESSION.lastCheck
        });
    } catch (err) {
        errorLog('Error loading session:', err);
        clearSession();
    }
}

function clearSession() {
    debugLog('Clearing Session');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    SESSION.token = null;
    SESSION.user = null;
    SESSION.lastCheck = null;
    SESSION.lastRedirect = null;
    SESSION.redirectCount = 0;
}

function isLoginPage() {
    const path = window.location.pathname.toLowerCase();
    const isLogin = path.includes('login') || path.includes('register');
    debugLog('Page Check', { path, isLogin });
    return isLogin;
}

function safeRedirect(url) {
    // Prevent redirect if already redirecting
    if (SESSION.redirecting) {
        debugLog('Redirect Blocked - Already redirecting');
        return;
    }
    
    // Prevent redirect loop
    const now = Date.now();
    if (SESSION.lastRedirect && (now - SESSION.lastRedirect) < 2000) {
        debugLog('Redirect Blocked - Too frequent');
        return;
    }
    
    // Prevent too many redirects
    SESSION.redirectCount++;
    if (SESSION.redirectCount > 3) {
        debugLog('Redirect Blocked - Too many redirects');
        clearSession();
        return;
    }
    
    // Normalize paths
    const currentPath = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    let targetPath = url.toLowerCase().replace(/^\/+|\/+$/g, '');
    
    // Add .html extension if missing
    if (!targetPath.includes('.')) {
        targetPath = `${targetPath}.html`;
    }
    
    debugLog('Redirect Check', {
        from: currentPath,
        to: targetPath,
        redirectCount: SESSION.redirectCount
    });
    
    // Prevent redirect to the same page
    if (currentPath === targetPath || 
        (currentPath.replace('.html', '') === targetPath.replace('.html', ''))) {
        debugLog('Redirect Blocked - Same page');
        return;
    }
    
    SESSION.redirecting = true;
    SESSION.lastRedirect = now;
    debugLog('Redirecting', { to: targetPath });
    
    // Use replace for login/register redirects, use assign for others
    const isAuthPage = targetPath.includes('login') || targetPath.includes('register') ||
                      currentPath.includes('login') || currentPath.includes('register');
    
    // Ensure the URL starts with /
    const finalUrl = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
    
    if (isAuthPage) {
        window.location.replace(finalUrl);
    } else {
        window.location.assign(finalUrl);
    }
}

async function checkAuth() {
    // Prevent multiple simultaneous checks
    if (SESSION.isCheckingAuth || SESSION.redirecting) {
        debugLog('Auth Check Blocked', {
            isCheckingAuth: SESSION.isCheckingAuth,
            redirecting: SESSION.redirecting
        });
        return;
    }

    try {
        SESSION.isCheckingAuth = true;
        debugLog('Starting Auth Check');

        loadSession();
        
        const currentPath = window.location.pathname.toLowerCase();
        const isOnLoginPage = isLoginPage();
        
        debugLog('Auth State', { 
            path: currentPath,
            isLoginPage: isOnLoginPage,
            hasToken: !!SESSION.token,
            hasUser: !!SESSION.user,
            lastCheck: SESSION.lastCheck,
            redirectCount: SESSION.redirectCount
        });

        // Handle login/register pages
        if (isOnLoginPage) {
            if (SESSION.token && SESSION.user) {
                try {
                    debugLog('Verifying token on login page');
                    const verifyResult = await makeApiRequest(CONFIG.ENDPOINTS.VERIFY);
                    debugLog('Token valid on login page', verifyResult);
                    safeRedirect('dashboard.html');
                } catch (err) {
                    debugLog('Invalid token on login page', err);
                    clearSession();
                }
            }
            return;
        }

        // For all other pages, verify token if exists
        if (SESSION.token && SESSION.user) {
            try {
                debugLog('Verifying token on protected page');
                const verifyResult = await makeApiRequest(CONFIG.ENDPOINTS.VERIFY);
                debugLog('Token verification successful', verifyResult);
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
            debugLog('No auth found, redirecting to login');
            clearSession();
            if (!isOnLoginPage) {
                safeRedirect('login.html');
            }
        }

    } catch (err) {
        errorLog('Auth check error:', err);
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
    debugLog('Page Loaded - Initializing auth check');
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
