import { CONFIG, makeApiRequest } from './js/utils.js';
import { debugLog, errorLog, showStatusMessage, safeRedirect } from './script.js';

// REGISTER
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confPassword = document.getElementById('confPassword').value;

        if (password.length < 6) {
            showStatusMessage('Password harus minimal 6 karakter!', 'error');
            return;
        }

        if (password !== confPassword) {
            showStatusMessage('Password dan konfirmasi password tidak cocok!', 'error');
            return;
        }

        try {
            debugLog('Attempting registration for:', email);
            showStatusMessage('Sedang mendaftar...', 'info');

            const data = await makeApiRequest(CONFIG.ENDPOINTS.REGISTER, {
                method: 'POST',
                body: JSON.stringify({ username, email, password, confPassword })
            });

            showStatusMessage('Register berhasil! Mengalihkan ke halaman login...', 'success');
            
            // Small delay to show the success message
            setTimeout(() => {
                safeRedirect('login.html');
            }, 1500);
        } catch (err) {
            errorLog('Registration error:', err);
            showStatusMessage(err.message || 'Terjadi kesalahan saat register.', 'error');
        }
    });

    // Password strength meter
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.querySelector('.strength-meter');

    if (passwordInput && strengthMeter) {
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            let strength = 0;
            
            // Only check for minimum length of 6 characters
            if (password.length >= 6) {
                strength = 100;
            } else {
                strength = (password.length / 6) * 100;
            }

            strengthMeter.style.width = strength + '%';
            if (password.length >= 6) {
                strengthMeter.style.backgroundColor = '#4dff4d';
            } else {
                strengthMeter.style.backgroundColor = '#ff4d4d';
            }
        });
    }
} 