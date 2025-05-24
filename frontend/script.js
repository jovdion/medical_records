const API_URL = 'https://notes-be-oscar-final-23024569990.us-central1.run.app';

// Helper untuk gabungkan base URL dan path tanpa double slash
function joinUrl(base, path) {
    if (base.endsWith('/')) {
        base = base.slice(0, -1);
    }
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    return base + path;
}

// Ambil token dari localStorage
const token = localStorage.getItem('token');

// Cek jika token tidak ada dan user ada di halaman yang memerlukan autentikasi → redirect ke login
// Asumsi halaman yang memerlukan autentikasi adalah index.html
if (!token && (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/'))) {
    window.location.href = 'login.html';
}

// Fungsi untuk menangani session expired
function handleSessionExpired() {
    // Replaced alert with a custom message box or modal if this were a full application.
    // For this context, keeping it simple as per original code, but noting the best practice.
    alert('Sesi Anda telah habis. Silakan login ulang.');
    localStorage.removeItem('token');

    // Hentikan refresh interval jika ada
    if (window.refreshIntervalId) {
        clearInterval(window.refreshIntervalId);
    }

    window.location.href = 'login.html';
}

// Fungsi untuk memeriksa respons API jika token tidak valid
function checkTokenValidity(response) {
    if (response.status === 401 || response.status === 403) {
        handleSessionExpired();
        return false;
    }
    return true;
}

// Fungsi untuk melakukan request API dengan validasi token
async function apiRequest(url, options = {}) {
    try {
        // Pastikan header authorization selalu ada
        if (!options.headers) {
            options.headers = {};
        }
        options.headers.Authorization = `Bearer ${token}`;

        const response = await fetch(url, options);

        // Cek validitas token untuk semua request
        if (!checkTokenValidity(response)) {
            return null;
        }

        return response;
    } catch (err) {
        console.error("API Request Error:", err);
        throw err;
    }
}

// ====================================================================================
// LOGIKA UNTUK LOGIN.HTML
// ====================================================================================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(joinUrl(API_URL, 'login'), { // Gunakan fetch langsung karena ini endpoint login
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert("Login gagal: " + (errorData.msg || "Terjadi kesalahan"));
                return;
            }

            const data = await response.json();
            localStorage.setItem("token", data.accessToken); // simpan token

            // redirect ke halaman utama
            window.location.href = "index.html";
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan saat login.");
        }
    });
}

// ====================================================================================
// LOGIKA UNTUK REGISTER.HTML
// ====================================================================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confPassword = document.getElementById('confPassword').value;

        // Validasi password dan konfirmasi password
        if (password !== confPassword) {
            alert('Password dan konfirmasi password tidak cocok!');
            return;
        }

        try {
            const response = await fetch(joinUrl(API_URL, 'users'), { // Gunakan fetch langsung karena ini endpoint register
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, confPassword })
            });

            if (response.ok) {
                alert('Register berhasil! Silakan login.');
                window.location.href = 'login.html';
            } else {
                const data = await response.json();
                alert('Gagal Register: ' + (data.msg || 'Terjadi kesalahan'));
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat register.');
        }
    });

    // Simple password strength indicator untuk register.html
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.querySelector('.strength-meter');

    if (passwordInput && strengthMeter) { // Pastikan elemen ada sebelum menambahkan event listener
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            let strength = 0;

            if (password.length >= 8) strength += 25;
            if (password.match(/[A-Z]/)) strength += 25;
            if (password.match(/[0-9]/)) strength += 25;
            if (password.match(/[^A-Za-z0-9]/)) strength += 25;

            strengthMeter.style.width = strength + '%';

            if (strength <= 25) {
                strengthMeter.style.backgroundColor = '#ff4d4d'; // Red
            } else if (strength <= 50) {
                strengthMeter.style.backgroundColor = '#ffa64d'; // Orange
            } else if (strength <= 75) {
                strengthMeter.style.backgroundColor = '#ffff4d'; // Yellow
            } else {
                strengthMeter.style.backgroundColor = '#4dff4d'; // Green
            }
        });
    }
}

// ====================================================================================
// LOGIKA UNTUK INDEX.HTML (Aplikasi Catatan)
// ====================================================================================

// Elemen-elemen yang hanya ada di index.html
const catatanForm = document.getElementById('catatan-form');
const catatanIdField = document.getElementById('catatan-id');
const namaField = document.getElementById('nama');
const judulField = document.getElementById('judul');
const isiField = document.getElementById('isi');
const catatanList = document.getElementById('catatan-list');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const statusDiv = document.getElementById('status');
const logoutBtn = document.getElementById('logoutBtn'); // ID tombol logout di index.html

// Hanya jalankan jika elemen-elemen untuk index.html ada (yaitu, kita berada di index.html)
if (catatanForm && catatanIdField && namaField && judulField && isiField && catatanList && formTitle && submitBtn && cancelBtn && statusDiv) {
    cancelBtn.addEventListener('click', resetForm);
    catatanForm.addEventListener('submit', handleCatatanSubmit); // Ganti dengan handler tunggal

    document.addEventListener('DOMContentLoaded', () => {
        fetchNotes(); // Mengambil catatan saat DOM dimuat
        // Aktifkan refresh token otomatis dan simpan ID-nya di variabel global
        // agar bisa diakses dari handleSessionExpired
        window.refreshIntervalId = setupTokenRefresh();
    });

    // Tambahkan event listener untuk membersihkan interval saat user meninggalkan halaman
    window.addEventListener('beforeunload', () => {
        if (window.refreshIntervalId) {
            clearInterval(window.refreshIntervalId);
        }
    });
}

// Logika Logout (untuk semua halaman, tapi tombol ada di index.html)
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            // Coba logout dari backend untuk menghapus refresh token cookie
            await fetch(joinUrl(API_URL, 'logout'), {
                method: 'DELETE',
                credentials: 'include' // Penting untuk cookies
            });
        } catch (error) {
            console.error('Error saat logout:', error);
        } finally {
            // Hapus token dari localStorage
            localStorage.removeItem('token');

            // Hentikan refresh interval jika ada
            if (window.refreshIntervalId) {
                clearInterval(window.refreshIntervalId);
            }

            // Redirect ke login
            window.location.href = 'login.html';
        }
    });
}


async function fetchNotes() {
    try {
        const response = await apiRequest(`${API_URL}/catatan`); // Sesuaikan endpoint API Notes

        // Jika respons null, berarti session expired dan sudah dialihkan
        if (!response) return;

        if (!response.ok) {
            throw new Error("Gagal mengambil catatan");
        }

        const notes = await response.json();

        if (!catatanList) { // Pastikan catatanList ada
            console.error("Element dengan id 'catatan-list' tidak ditemukan");
            return;
        }

        catatanList.innerHTML = '';

        if (notes.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4">Belum ada catatan. Buat catatan baru!</td>`;
            catatanList.appendChild(row);
            return;
        }

        notes.forEach(note => {
            const row = document.createElement('tr');
            // Assuming 'konten' is the field name for the note's content from the backend
            row.innerHTML = `
                <td>${note.name || 'N/A'}</td>
                <td>${note.judul}</td>
                <td>${note.konten}</td>
                <td>
                    <button onclick="editNote(${note.id}, '${note.name}', '${note.judul}', '${note.konten}')" class="edit">Edit</button>
                    <button onclick="deleteNote(${note.id})" class="delete">Hapus</button>
                </td>
            `;
            catatanList.appendChild(row);
        });

    } catch (error) {
        console.error('Error fetching notes:', error);
        // Using alert for simplicity, consider a custom modal for better UX
        alert('Gagal mengambil catatan.');
    }
}

// Fungsi untuk reset form ke mode tambah
function resetForm() {
    if (!catatanIdField || !namaField || !judulField || !isiField || !formTitle || !submitBtn || !cancelBtn || !statusDiv) return;

    catatanIdField.value = '';
    namaField.value = '';
    judulField.value = '';
    isiField.value = '';
    formTitle.textContent = 'Tambah Catatan Baru';
    submitBtn.textContent = 'Tambah';
    cancelBtn.style.display = 'none';
    statusDiv.textContent = '';
}

// Fungsi untuk submit form tambah/edit catatan
async function handleCatatanSubmit(event) {
    event.preventDefault();

    const id = catatanIdField.value;
    const name = namaField.value;
    const judul = judulField.value;
    const isi_catatan = isiField.value; // Changed 'konten' to 'isi_catatan' here

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/catatan-update/${id}` : `${API_URL}/catatan`;

    try {
        const response = await apiRequest(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            // Sending 'isi_catatan' as the key for the note content
            body: JSON.stringify({ name, judul, isi_catatan }) 
        });

        if (!response) return; // session expired

        if (!response.ok) {
            const data = await response.json();
            // Using alert for simplicity, consider a custom modal for better UX
            alert(`Gagal ${id ? 'mengubah' : 'menambahkan'} catatan: ` + (data.msg || 'Terjadi kesalahan'));
            return;
        }

        resetForm();
        fetchNotes();

    } catch (error) {
        console.error('Error submitting note:', error);
        // Using alert for simplicity, consider a custom modal for better UX
        alert('Terjadi kesalahan saat menyimpan catatan.');
    }
}

// Fungsi untuk hapus catatan
async function deleteNote(id) {
    // Replaced confirm with a custom message box or modal if this were a full application.
    // For this context, keeping it simple as per original code, but noting the best practice.
    if (!confirm('Anda yakin ingin menghapus catatan ini?')) return;

    try {
        const response = await apiRequest(`${API_URL}/catatan-hapus/${id}`, { method: 'DELETE' });

        if (!response) return; // session expired

        if (!response.ok) {
            const data = await response.json();
            // Using alert for simplicity, consider a custom modal for better UX
            alert('Gagal menghapus catatan: ' + (data.msg || 'Terjadi kesalahan'));
            return;
        }

        fetchNotes();
    } catch (error) {
        console.error('Error deleting note:', error);
        // Using alert for simplicity, consider a custom modal for better UX
        alert('Terjadi kesalahan saat menghapus catatan.');
    }
}

// Fungsi untuk isi form dengan data catatan untuk diedit
function editNote(id, name, judul, konten) {
    if (!catatanIdField || !namaField || !judulField || !isiField || !formTitle || !submitBtn || !cancelBtn || !statusDiv) return;

    catatanIdField.value = id;
    namaField.value = name;
    judulField.value = judul;
    isiField.value = konten; // 'konten' is used here as it's received from fetchNotes
    formTitle.textContent = 'Edit Catatan';
    submitBtn.textContent = 'Simpan';
    cancelBtn.style.display = 'inline';
    statusDiv.textContent = '';
}

// Fungsi refresh token otomatis, misalnya setiap 10 menit
function setupTokenRefresh() {
    const intervalMs = 10 * 60 * 1000; // 10 menit

    const id = setInterval(async () => {
        try {
            // Lakukan request untuk refresh token
            const response = await fetch(joinUrl(API_URL, 'refresh'), {
                method: 'GET',
                credentials: 'include' // penting agar cookie refresh token dikirim
            });

            if (!response.ok) {
                // Jika refresh gagal, anggap sesi habis
                handleSessionExpired();
                clearInterval(id);
                return;
            }

            const data = await response.json();
            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
            }
        } catch (err) {
            console.error('Gagal refresh token:', err);
            handleSessionExpired();
            clearInterval(id);
        }
    }, intervalMs);

    return id;
}
