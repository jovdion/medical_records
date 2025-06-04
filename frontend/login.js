import { CONFIG, makeApiRequest, logDebug } from './js/utils.js';
import { SESSION, debugLog, errorLog, showStatusMessage, safeRedirect } from './script.js';

// Only check login state if we're on the login page
if (window.location.pathname.toLowerCase().includes('login.html')) {
    debugLog('Login Page Init');
    // Check if we're already logged in
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    if (token && currentUser && !SESSION.redirecting) {
        debugLog('Found existing session on login page', { hasToken: !!token });
        makeApiRequest(CONFIG.ENDPOINTS.VERIFY)
            .then(() => {
                debugLog('Token verified on login page');
                if (!SESSION.redirecting) {
                    safeRedirect('dashboard.html');
                }
            })
            .catch((err) => {
                debugLog('Token verification failed on login page', err);
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                SESSION.token = null;
                SESSION.user = null;
            });
    }
}

// LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    debugLog('Login form detected');
    
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (SESSION.isCheckingAuth || SESSION.redirecting) {
            debugLog('Login blocked - Auth check or redirect in progress');
            return;
        }

        debugLog('Login form submitted');

        const loginButton = document.getElementById('loginButton');
        const loginSpinner = document.getElementById('loginSpinner');
        const loginText = document.getElementById('loginText');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        // Disable form
        loginButton.disabled = true;
        emailInput.disabled = true;
        passwordInput.disabled = true;
        if (loginSpinner) loginSpinner.style.display = 'inline-block';
        if (loginText) loginText.textContent = 'Logging in...';

        try {
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Validate input
            if (!email || !password) {
                throw new Error('Email dan password harus diisi');
            }

            debugLog('Attempting login', { email });
            showStatusMessage('Sedang login...', 'info');

            const data = await makeApiRequest(CONFIG.ENDPOINTS.LOGIN, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            debugLog('Login successful', { user: data.user });
            
            // Update session with clean token
            const cleanToken = data.accessToken.trim();
            SESSION.token = cleanToken;
            SESSION.user = data.user;
            SESSION.lastCheck = Date.now();
            SESSION.redirectCount = 0;
            
            showStatusMessage(data.msg || 'Login berhasil! Mengalihkan ke dashboard...', 'success');
            
            // Small delay before verifying token
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
                debugLog('Verifying token after login', {
                    hasToken: !!localStorage.getItem('token'),
                    sessionToken: !!SESSION.token,
                    tokenPreview: cleanToken.substring(0, 10) + '...'
                });
                
                // Double check token format
                if (!cleanToken.startsWith('ey')) {
                    throw new Error('Format token tidak valid');
                }
                
                // Ensure clean token is in localStorage before verification
                if (!localStorage.getItem('token') || localStorage.getItem('token') !== cleanToken) {
                    localStorage.setItem('token', cleanToken);
                }
                
                // Try to verify token
                const verifyResult = await makeApiRequest(CONFIG.ENDPOINTS.VERIFY, {
                    headers: {
                        'Authorization': `Bearer ${cleanToken}`
                    }
                });
                
                debugLog('Token verified after login', verifyResult);
                
                // Delay redirect to show success message
                setTimeout(() => {
                    if (!SESSION.redirecting) {
                        safeRedirect('dashboard.html');
                    }
                }, 1000);
            } catch (verifyErr) {
                errorLog('Token verification failed after login', {
                    error: verifyErr,
                    tokenPreview: cleanToken.substring(0, 10) + '...'
                });
                
                // Clear invalid session
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                SESSION.token = null;
                SESSION.user = null;
                
                throw new Error('Gagal memverifikasi sesi login. Silakan coba lagi.');
            }

        } catch (err) {
            errorLog('Login error', err);
            showStatusMessage(err.message || "Terjadi kesalahan saat login. Silakan coba lagi.", 'error');
            
            // Clear password field on error
            passwordInput.value = '';
            passwordInput.focus();
            
            // Clear any invalid session
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            SESSION.token = null;
            SESSION.user = null;
            SESSION.redirectCount = 0;
        } finally {
            // Re-enable form after a delay
            setTimeout(() => {
                if (!SESSION.redirecting) {
                    loginButton.disabled = false;
                    emailInput.disabled = false;
                    passwordInput.disabled = false;
                    if (loginSpinner) loginSpinner.style.display = 'none';
                    if (loginText) loginText.textContent = 'Masuk';
                }
            }, 1000);
        }
    });
}

// LOGOUT
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (SESSION.isCheckingAuth || SESSION.redirecting) {
            debugLog('Logout blocked - Auth check or redirect in progress');
            return;
        }

        try {
            debugLog('Initiating logout');
            showStatusMessage('Sedang logout...', 'info');
            
            await makeApiRequest(CONFIG.ENDPOINTS.LOGOUT, {
                method: 'DELETE'
            });
            
            debugLog('Logout successful');
            
        } catch (error) {
            errorLog('Logout error', error);
        } finally {
            // Always clear session and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            SESSION.token = null;
            SESSION.user = null;
            SESSION.redirectCount = 0;
            showStatusMessage('Logout berhasil!', 'success');
            
            // Small delay to show the success message
            setTimeout(() => {
                safeRedirect('login.html');
            }, 1000);
        }
    });
} 