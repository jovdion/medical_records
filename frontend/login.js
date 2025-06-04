import { CONFIG, makeApiRequest } from './js/utils.js';
import { SESSION, debugLog, errorLog, showStatusMessage, safeRedirect } from './script.js';

// Only check login state if we're on the login page
if (window.location.pathname.toLowerCase().includes('login.html')) {
    // Check if we're already logged in
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    if (token && currentUser && !SESSION.redirecting) {
        debugLog('Found existing session, verifying token...');
        makeApiRequest(CONFIG.ENDPOINTS.VERIFY)
            .then(() => {
                debugLog('Token valid, redirecting to dashboard');
                if (!SESSION.redirecting) {
                    safeRedirect('dashboard.html');
                }
            })
            .catch((err) => {
                debugLog('Invalid token, clearing session:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                SESSION.token = null;
                SESSION.user = null;
                // Don't redirect, just clear the session
            });
    }
}

// LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    debugLog('Login form detected, setting up event listener');
    
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (SESSION.isCheckingAuth || SESSION.redirecting) {
            debugLog('Auth check or redirect in progress, preventing login');
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
        loginSpinner.style.display = 'inline-block';
        loginText.textContent = 'Logging in...';

        try {
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Validate input
            if (!email || !password) {
                throw new Error('Email dan password harus diisi');
            }

            debugLog('Attempting login for email:', email);
            showStatusMessage('Sedang login...', 'info');

            const data = await makeApiRequest(CONFIG.ENDPOINTS.LOGIN, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            debugLog('Login successful:', data);
            
            // Update session and storage
            SESSION.token = data.accessToken;
            SESSION.user = data.user;
            SESSION.lastCheck = Date.now();
            
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            
            showStatusMessage(data.msg || 'Login berhasil! Mengalihkan ke dashboard...', 'success');
            
            // Delay redirect to show success message
            setTimeout(() => {
                if (!SESSION.redirecting) {
                    safeRedirect('dashboard.html');
                }
            }, 1500);

        } catch (err) {
            errorLog("Login error:", err);
            showStatusMessage(err.message || "Terjadi kesalahan saat login. Silakan coba lagi.", 'error');
            
            // Clear password field on error
            passwordInput.value = '';
            passwordInput.focus();
            
            // Clear any invalid session
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            SESSION.token = null;
            SESSION.user = null;
        } finally {
            // Re-enable form after a delay
            setTimeout(() => {
                if (!SESSION.redirecting) {
                    loginButton.disabled = false;
                    emailInput.disabled = false;
                    passwordInput.disabled = false;
                    loginSpinner.style.display = 'none';
                    loginText.textContent = 'Masuk';
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
            debugLog('Auth check or redirect in progress, preventing logout');
            return;
        }

        try {
            debugLog('Logging out...');
            showStatusMessage('Sedang logout...', 'info');
            
            await makeApiRequest(CONFIG.ENDPOINTS.LOGOUT, {
                method: 'DELETE'
            });
            
            debugLog('Logout successful');
            
        } catch (error) {
            errorLog('Logout error:', error);
        } finally {
            // Always clear session and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            showStatusMessage('Logout berhasil!', 'success');
            
            // Small delay to show the success message
            setTimeout(() => {
                safeRedirect('login.html');
            }, 1000);
        }
    });
} 