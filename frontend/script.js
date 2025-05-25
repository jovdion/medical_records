const API_URL = 'https://notes-be-oscar-final-23024569990.us-central1.run.app';

function joinUrl(base, path) {
    if (base.endsWith('/')) {
        base = base.slice(0, -1);
    }
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    return base + path;
}

// Gunakan let agar token bisa diperbarui
let token = localStorage.getItem('token');

// Fungsi untuk menangani session expired
function handleSessionExpired() {
    alert('Sesi Anda telah habis. Silakan login ulang.');
    localStorage.removeItem('token');
    if (window.refreshIntervalId) {
        clearInterval(window.refreshIntervalId);
    }
    // Set token menjadi null setelah dihapus dari localStorage
    token = null;
    window.location.href = 'login.html';
}

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
            const response = await fetch(joinUrl(API_URL, 'login'), {
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
            localStorage.setItem("token", data.accessToken);
            token = data.accessToken; // Perbarui variabel token global

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

        if (password !== confPassword) {
            alert('Password dan konfirmasi password tidak cocok!');
            return;
        }

        try {
            const response = await fetch(joinUrl(API_URL, 'users'), {
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

    const passwordInput = document.getElementById('password');
    const strengthMeter = document.querySelector('.strength-meter');

    if (passwordInput && strengthMeter) {
        passwordInput.addEventListener('input', function () {
            const password = this.value;
            let strength = 0;

            if (password.length >= 8) strength += 25;
            if (password.match(/[A-Z]/)) strength += 25;
            if (password.match(/[0-9]/)) strength += 25;
            if (password.match(/[^A-Za-z0-9]/)) strength += 25;

            strengthMeter.style.width = strength + '%';

            if (strength <= 25) {
                strengthMeter.style.backgroundColor = '#ff4d4d';
            } else if (strength <= 50) {
                strengthMeter.style.backgroundColor = '#ffa64d';
            } else if (strength <= 75) {
                strengthMeter.style.backgroundColor = '#ffff4d';
            } else {
                strengthMeter.style.backgroundColor = '#4dff4d';
            }
        });
    }
}

// ====================================================================================
// LOGIKA UNTUK INDEX.HTML (Aplikasi Catatan)
// ====================================================================================

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
const logoutBtn = document.getElementById('logoutBtn');

if (catatanForm && catatanIdField && namaField && judulField && isiField && catatanList && formTitle && submitBtn && cancelBtn && statusDiv) {
    cancelBtn.addEventListener('click', resetForm);
    catatanForm.addEventListener('submit', handleCatatanSubmit);
    
    window.addEventListener('beforeunload', () => {
        if (window.refreshIntervalId) {
            clearInterval(window.refreshIntervalId);
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch(joinUrl(API_URL, 'logout'), {
                method: 'DELETE',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error saat logout:', error);
        } finally {
            localStorage.removeItem('token');
            if (window.refreshIntervalId) {
                clearInterval(window.refreshIntervalId);
            }
            token = null; // Pastikan token global juga null setelah logout
            window.location.href = 'login.html';
        }
    });
}

// async function initializeAuthAndFetchNotes() {
//     // Cek apakah token sudah ada, jika tidak, arahkan ke login
//     if (!token) {
//         handleSessionExpired(); // Ini akan redirect ke login
//         return;
//     }

//     // Coba refresh token saat halaman dimuat
//     try {
//         const response = await fetch(joinUrl(API_URL, 'refresh'), {
//             method: 'GET',
//             credentials: 'include'
//         });

//         if (!response.ok) {
//             handleSessionExpired();
//             return;
//         }

//         const data = await response.json();
//         if (data.accessToken) {
//             localStorage.setItem('token', data.accessToken);
//             token = data.accessToken;
//             console.log('Access token berhasil diperbarui saat memuat halaman.');
//         } else {
//             handleSessionExpired();
//             return;
//         }
//     } catch (err) {
//         console.error('Gagal refresh token saat memuat halaman:', err);
//         handleSessionExpired();
//         return;
//     }

//     fetchNotes();
//     window.refreshIntervalId = setupTokenRefresh();
// }

async function fetchNotes() {
    try {
        const response = await apiRequest(`${API_URL}/catatan`);

        if (!response) return;

        if (!response.ok) {
            throw new Error("Gagal mengambil catatan");
        }

        const notes = await response.json();

        if (!catatanList) {
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
            // MENGGUNAKAN note.catatan_id sebagai ID
            // Pastikan properti ini benar-benar ada di objek note dari backend
            row.innerHTML = `
                <td>${note.catatan_id}</td>
                <td>${note.name}</td>
                <td>${note.judul}</td>
                <td>${note.isi_catatan}</td>
                <td>
                    <button onclick="editNote(${note.catatan_id}, '${note.name}', '${note.judul}', '${note.isi_catatan}')" class="edit">Edit</button>
                    <button onclick="deleteNote(${note.catatan_id})" class="delete">Hapus</button>
                </td>
            `;
            catatanList.appendChild(row);
        });

    } catch (error) {
        console.error('Error fetching notes:', error);
        alert('Gagal mengambil catatan.');
    }
}

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

async function handleCatatanSubmit(event) {
    event.preventDefault();

    const id = catatanIdField.value;
    const name = namaField.value;
    const judul = judulField.value;
    const isi_catatan = isiField.value;

    if (!name || !judul || !isi_catatan) {
        alert('Nama, judul, dan isi catatan tidak boleh kosong.');
        return;
    }

    const method = id ? 'PUT' : 'POST';
    // Menggunakan ID yang ditangkap dari hidden field
    const url = id ? `${API_URL}/catatan-update/${id}` : `${API_URL}/catatan`;

    try {
        const response = await apiRequest(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, judul, isi_catatan })
        });

        if (!response) return;

        if (!response.ok) {
            const data = await response.json();
            alert(`Gagal ${id ? 'mengubah' : 'menambahkan'} catatan: ` + (data.msg || 'Terjadi kesalahan'));
            return;
        }

        resetForm();
        fetchNotes();

    } catch (error) {
        console.error('Error submitting note:', error);
        alert('Terjadi kesalahan saat menyimpan catatan.');
    }
}

async function deleteNote(id) {
    if (!confirm('Anda yakin ingin menghapus catatan ini?')) return;

    try {
        const response = await apiRequest(`${API_URL}/catatan-hapus/${id}`, { method: 'DELETE' });

        if (!response) return;

        if (!response.ok) {
            const data = await response.json();
            alert('Gagal menghapus catatan: ' + (data.msg || 'Terjadi kesalahan'));
            return;
        }

        fetchNotes();
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Terjadi kesalahan saat menghapus catatan.');
    }
}

function editNote(id, name, judul, isi_catatan) {
    if (!catatanIdField || !namaField || !judulField || !isiField || !formTitle || !submitBtn || !cancelBtn || !statusDiv) return;

    catatanIdField.value = id; // Set ID ke hidden field
    namaField.value = name;
    judulField.value = judul;
    isiField.value = isi_catatan;
    formTitle.textContent = 'Edit Catatan';
    submitBtn.textContent = 'Simpan';
    cancelBtn.style.display = 'inline';
    statusDiv.textContent = '';
}

function setupTokenRefresh() {
    // Refresh token setiap 10 detik, karena token expire setiap 15 detik
    const REFRESH_INTERVAL = 10 * 1000; // 10 detik

    const refreshIntervalId = setInterval(async () => {
        try {
            // Gunakan endpoint refresh token yang sudah ada
            const response = await fetch(`${API_URL}/token`, {
                method: 'GET',
                credentials: 'include' // Penting untuk mengirim cookies
            });

            if (response.ok) {
                const data = await response.json();
                if (data.accessToken) {
                    localStorage.setItem('token', data.accessToken);
                    console.log('Token berhasil di-refresh');
                }
            } else if (response.status === 401 || response.status === 403) {
                clearInterval(refreshIntervalId);
                handleSessionExpired();
            }
        } catch (error) {
            console.error('Gagal refresh token:', error);
        }
    }, REFRESH_INTERVAL);

    return refreshIntervalId;
}

if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    // Tunggu DOM selesai loading
    document.addEventListener('DOMContentLoaded', () => {
        fetchNotes();

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

