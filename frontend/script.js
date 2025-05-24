const API_URL = 'https://notes-be-oscar-final-23024569990.us-central1.run.app/';
// const API_URL = 'http://localhost:5000'; // Gunakan ini jika Anda menjalankan backend secara lokal

// Ambil token dari localStorage
const token = localStorage.getItem('token');

// Cek jika token tidak ada dan user ada di halaman yang memerlukan autentikasi → redirect ke login
// Asumsi halaman yang memerlukan autentikasi adalah index.html
if (!token && (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/'))) {
    window.location.href = 'login.html';
}

// Fungsi untuk menangani session expired
function handleSessionExpired() {
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
        // Hanya tambahkan token jika ada
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }


        const response = await fetch(url, options);

        // Cek validitas token untuk semua request yang memerlukan autentikasi
        // Periksa jika respons bukan dari endpoint login/register yang tidak memerlukan token
        if (!url.includes('/login') && !url.includes('/users') && !checkTokenValidity(response)) {
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
            const response = await fetch(`${API_URL}/login`, { // Gunakan fetch langsung karena ini endpoint login
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
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
            const response = await fetch(`${API_URL}/users`, { // Gunakan fetch langsung karena ini endpoint register
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
const namaField = document.getElementById('nama'); // Tambahkan ini
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
            await fetch(`${API_URL}/logout`, {
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
        const response = await apiRequest(`${API_URL}/Notes`); // Sesuaikan endpoint API Notes

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
            row.innerHTML = `
                <td>${note.name || 'N/A'}</td> <td>${note.judul}</td>
                <td>${note.konten}</td> <td>
                    <button onclick="editNote(${note.id}, '${note.name}', '${note.judul}', '${note.konten}')" class="edit">Edit</button>
                    <button onclick="deleteNote(${note.id})" class="delete">Hapus</button>
                </td>
            `;
            catatanList.appendChild(row);
        });
        showStatus("Catatan berhasil dimuat.", "success"); // Tampilkan status sukses
    } catch (err) {
        console.error("Error:", err);
        showStatus("Gagal mengambil catatan. Mohon coba lagi.", "error");
    }
}

async function handleCatatanSubmit(e) {
    e.preventDefault();

    const id = catatanIdField.value;
    const name = namaField.value; // Ambil nama
    const judul = judulField.value;
    const konten = isiField.value; // Ambil isi dari textarea 'isi'

    try {
        const method = id ? 'PATCH' : 'POST'; // Gunakan PATCH untuk update, POST untuk create
        const url = id ? `${API_URL}/Notes/${id}` : `${API_URL}/Notes`; // Sesuaikan endpoint

        const response = await apiRequest(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name, // Sertakan nama
                judul,
                konten // Gunakan 'konten' untuk data yang dikirim ke BE
            })
        });

        // Jika respons null, berarti session expired dan sudah dialihkan
        if (!response) return;

        if (!response.ok) {
            const errorData = await response.json();
            showStatus('Gagal menyimpan catatan: ' + (errorData.msg || 'Terjadi kesalahan'), "error");
            return;
        }

        showStatus("Catatan berhasil disimpan!", "success");
        resetForm();
        fetchNotes();
    } catch (err) {
        console.error("Error:", err);
        showStatus('Gagal menyimpan catatan. Mohon coba lagi.', "error");
    }
}

async function deleteNote(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
        return;
    }

    try {
        const response = await apiRequest(`${API_URL}/Notes/${id}`, { // Sesuaikan endpoint
            method: 'DELETE'
        });

        // Jika respons null, berarti session expired dan sudah dialihkan
        if (!response) return;

        if (!response.ok) {
            const errorData = await response.json();
            showStatus('Gagal menghapus catatan: ' + (errorData.msg || 'Terjadi kesalahan'), "error");
            return;
        }

        showStatus("Catatan berhasil dihapus!", "success");
        fetchNotes();
    } catch (err) {
        console.error("Error:", err);
        showStatus('Gagal menghapus catatan. Mohon coba lagi.', "error");
    }
}

// Fungsi untuk mengisi form saat edit
function editNote(id, name, judul, konten) {
    catatanIdField.value = id;
    namaField.value = name; // Isi field nama
    judulField.value = judul;
    isiField.value = konten; // Isi field isi

    formTitle.textContent = 'Edit Catatan';
    submitBtn.textContent = 'Perbarui';
    cancelBtn.style.display = 'inline-block';

    // Scroll ke form agar user bisa edit
    catatanForm.scrollIntoView({
        behavior: 'smooth'
    });
}

function resetForm() {
    formTitle.textContent = 'Tambah Catatan Baru';
    catatanForm.reset();
    catatanIdField.value = '';
    submitBtn.textContent = 'Simpan';
    cancelBtn.style.display = 'none';
    statusDiv.style.display = 'none'; // Sembunyikan status saat reset form
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status'; // Reset class
    if (type === 'success') {
        statusDiv.classList.add('success');
    } else if (type === 'error') {
        statusDiv.classList.add('error');
    }
    statusDiv.style.display = 'block';
    // Sembunyikan setelah 5 detik
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}


// Fungsi untuk refresh token secara periodik
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

// Add button ripple effect for login.html and register.html
// Pastikan ini berjalan di kedua halaman tersebut
const buttons = document.getElementsByTagName("button");
for (let button of buttons) {
    button.addEventListener("click", function (e) {
        // Cek apakah tombol ini adalah tombol submit di form catatan atau tombol edit/delete
        // Agar efek ripple tidak mengganggu di index.html
        if (this.id === 'submit-btn' || this.classList.contains('edit') || this.classList.contains('delete') || this.classList.contains('logout-button')) {
            return;
        }

        let x = e.clientX - e.target.offsetLeft;
        let y = e.clientY - e.target.offsetTop;

        let ripple = document.createElement("span");
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        this.appendChild(ripple);

        setTimeout(function () {
            ripple.remove();
        }, 600);
    });
}