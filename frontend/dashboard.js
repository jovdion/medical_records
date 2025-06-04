import { CONFIG, makeApiRequest } from './js/utils.js';
import { debugLog, errorLog, showStatusMessage } from './script.js';

// Load dashboard data
async function loadDashboardData() {
    try {
        debugLog('Loading dashboard data...');
        const data = await makeApiRequest(CONFIG.ENDPOINTS.DASHBOARD);
        
        // Update statistics
        document.getElementById('totalPatients').textContent = data.totalPatients || '0';
        document.getElementById('totalDoctors').textContent = data.totalDoctors || '0';
        document.getElementById('totalRecords').textContent = data.totalRecords || '0';

        // Update recent records table
        const recentRecordsHtml = data.recentRecords.map(record => `
            <tr>
                <td>${new Date(record.visit_date).toLocaleDateString('id-ID')}</td>
                <td>${record.patient_name}</td>
                <td>${record.doctor_name}</td>
                <td>${record.diagnosis}</td>
            </tr>
        `).join('');

        document.getElementById('recentRecords').innerHTML = 
            recentRecordsHtml || '<tr><td colspan="4">Tidak ada data terbaru</td></tr>';

        showStatusMessage('Data berhasil dimuat', 'success');
    } catch (error) {
        errorLog('Error loading dashboard:', error);
        showStatusMessage('Gagal memuat data dashboard', 'error');
    }
}

// Display user info
function displayUserInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('userRole').textContent = currentUser.role.toUpperCase();
        document.getElementById('welcomeMessage').textContent = `Selamat datang, ${currentUser.username}!`;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    displayUserInfo();
    loadDashboardData();
}); 