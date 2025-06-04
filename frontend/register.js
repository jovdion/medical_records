import { CONFIG, makeApiRequest } from './js/utils.js';
import { SESSION, debugLog, errorLog, showStatusMessage, safeRedirect } from './script.js';

// Check if already logged in
if (localStorage.getItem('token') && localStorage.getItem('currentUser')) {
    debugLog('User already logged in, redirecting to dashboard');
    safeRedirect('dashboard.html');
}

// REGISTER
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    debugLog('Register form detected, setting up event listener');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (SESSION.isCheckingAuth || SESSION.redirecting) {
            debugLog('Auth check or redirect in progress, preventing registration');
            return;
        }

        const registerButton = document.getElementById('registerButton');
        const registerSpinner = document.getElementById('registerSpinner');
        const registerText = document.getElementById('registerText');
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confPassword = document.getElementById('confPassword').value;

        // Disable form
        const inputs = registerForm.getElementsByTagName('input');
        for (let input of inputs) {
            input.disabled = true;
        }
        registerButton.disabled = true;
        if (registerSpinner) registerSpinner.style.display = 'inline-block';
        if (registerText) registerText.textContent = 'Mendaftar...';

        try {
            // Validate input
            if (!username || !email || !password || !confPassword) {
                throw new Error('Semua field harus diisi!');
            }

            if (password.length < 6) {
                throw new Error('Password harus minimal 6 karakter!');
            }

            if (password !== confPassword) {
                throw new Error('Password dan konfirmasi password tidak cocok!');
            }

            debugLog('Attempting registration for:', email);
            showStatusMessage('Sedang mendaftar...', 'info');

            const data = await makeApiRequest(CONFIG.ENDPOINTS.REGISTER, {
                method: 'POST',
                body: JSON.stringify({ username, email, password, confPassword })
            });

            showStatusMessage(data.msg || 'Register berhasil! Mengalihkan ke halaman login...', 'success');
            
            // Clear form
            registerForm.reset();
            
            // Delay redirect to show success message
            setTimeout(() => {
                if (!SESSION.redirecting) {
                    safeRedirect('login.html');
                }
            }, 2000);

        } catch (err) {
            errorLog('Registration error:', err);
            showStatusMessage(err.message || 'Terjadi kesalahan saat register.', 'error');
            
            // Re-enable form
            for (let input of inputs) {
                input.disabled = false;
            }
            registerButton.disabled = false;
            if (registerSpinner) registerSpinner.style.display = 'none';
            if (registerText) registerText.textContent = 'Daftar';
            
            // Focus on the first input
            inputs[0].focus();
        }
    });

    // Password strength meter
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.querySelector('.strength-meter');

    if (passwordInput && strengthMeter) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            let message = '';
            
            // Check password strength
            if (password.length >= 8) strength += 25;
            if (password.match(/[a-z]+/)) strength += 25;
            if (password.match(/[A-Z]+/)) strength += 25;
            if (password.match(/[0-9]+/)) strength += 25;
            
            // Update strength meter
            strengthMeter.style.width = strength + '%';
            
            // Update color based on strength
            if (strength < 25) {
                strengthMeter.style.backgroundColor = '#ff4d4d';
                message = 'Sangat Lemah';
            } else if (strength < 50) {
                strengthMeter.style.backgroundColor = '#ffa64d';
                message = 'Lemah';
            } else if (strength < 75) {
                strengthMeter.style.backgroundColor = '#ffff4d';
                message = 'Sedang';
            } else {
                strengthMeter.style.backgroundColor = '#4dff4d';
                message = 'Kuat';
            }
            
            // Update strength message if element exists
            const strengthMessage = document.getElementById('strengthMessage');
            if (strengthMessage) {
                strengthMessage.textContent = message;
            }
        });
    }
} 