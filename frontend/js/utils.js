// API Configuration
const CONFIG = {
    // Change this based on environment
    BASE_URL: window._env_?.API_URL || 'https://medical-records-be-913201672104.us-central1.run.app',
    API_TIMEOUT: 30000, // 30 seconds
    DEBUG: true, // Enable detailed logging
    
    // API Endpoints
    ENDPOINTS: {
        LOGIN: '/api/login',
        LOGOUT: '/api/logout',
        VERIFY: '/api/token',
        REGISTER: '/api/users',
        PATIENTS: '/api/patients',
        DOCTORS: '/api/doctors',
        MEDICAL_RECORDS: '/api/medical-records',
        DASHBOARD: '/api/dashboard/stats'
    },

    // Default Headers
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },

    // Default Request Options
    REQUEST_OPTIONS: {
        credentials: 'include',
        mode: 'cors'
    }
};

// Helper function to join URL paths
function joinUrl(base, path) {
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!path.startsWith('/')) path = '/' + path;
    return base + path;
}

// Debug logging function
function logDebug(type, ...args) {
    if (CONFIG.DEBUG) {
        const timestamp = new Date().toISOString();
        const prefix = `[${type}] ${timestamp}`;
        console.log(prefix, ...args);
    }
}

// Helper function for making API requests
async function makeApiRequest(endpoint, options = {}) {
    const url = joinUrl(CONFIG.BASE_URL, endpoint);
    const token = localStorage.getItem('token');

    // Don't redirect to login page if we're already there
    const isLoginRequest = endpoint === CONFIG.ENDPOINTS.LOGIN;
    const isVerifyRequest = endpoint === CONFIG.ENDPOINTS.VERIFY;
    const isOnLoginPage = window.location.pathname.toLowerCase().includes('login.html');

    logDebug('API Request', {
        endpoint,
        url,
        method: options.method || 'GET',
        isLoginRequest,
        isVerifyRequest,
        isOnLoginPage,
        hasToken: !!token
    });

    const requestOptions = {
        ...CONFIG.REQUEST_OPTIONS,
        ...options,
        headers: {
            ...CONFIG.HEADERS,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        },
        credentials: 'include',
        mode: 'cors'
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
        
        logDebug('Fetch Request', {
            url,
            method: requestOptions.method || 'GET',
            headers: requestOptions.headers
        });
        
        const response = await fetch(url, {
            ...requestOptions,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        logDebug('API Response', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            logDebug('Response Data', data);
        } else {
            const text = await response.text();
            logDebug('Response Text', text);
            try {
                data = JSON.parse(text);
                logDebug('Parsed JSON Data', data);
            } catch (e) {
                data = { message: text };
                logDebug('Non-JSON Response', data);
            }
        }
        
        if (response.status === 401) {
            logDebug('Unauthorized', {
                isOnLoginPage,
                isLoginRequest,
                isVerifyRequest
            });
            
            // Handle unauthorized access
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            
            // Only redirect to login if we're not already there and this isn't a login/verify request
            if (!isOnLoginPage && !isLoginRequest && !isVerifyRequest) {
                logDebug('Redirecting to login due to unauthorized access');
                window.location.replace('/login.html');
            }
            
            throw new Error(data.message || 'Unauthorized access');
        }

        if (!response.ok) {
            logDebug('Response Error', {
                status: response.status,
                data
            });
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            logDebug('Timeout Error', error);
            throw new Error('Request timeout');
        }
        
        // Handle CORS errors
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            logDebug('CORS or Network Error', {
                url,
                error: error.message,
                origin: window.location.origin
            });
            
            throw new Error('Tidak dapat terhubung ke server. Mohon coba lagi nanti.');
        }
        
        // If it's a network error and we're not on login page, redirect to login
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            logDebug('Network Error', {
                isOnLoginPage,
                isLoginRequest,
                isVerifyRequest
            });
            
            if (!isOnLoginPage && !isLoginRequest && !isVerifyRequest) {
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                window.location.replace('/login.html');
            }
        }
        
        logDebug('API Error', error);
        throw error;
    }
}

export { CONFIG, joinUrl, makeApiRequest, logDebug };