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
        VERIFY: '/api/token/verify',
        REFRESH: '/api/token/refresh',
        REGISTER: '/api/users',
        PATIENTS: '/api/patients',
        DOCTORS: '/api/doctors',
        MEDICAL_RECORDS: '/api/medical-records',
        DASHBOARD: '/api/dashboard/stats'
    },

    // Default Headers
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },

    // Default Request Options
    REQUEST_OPTIONS: {
        mode: 'cors',
        credentials: 'include',
        withCredentials: true
    },

    // Token Storage Keys
    TOKEN_KEYS: {
        ACCESS_TOKEN: 'access_token',
        REFRESH_TOKEN: 'refresh_token',
        USER: 'currentUser'
    }
};

// Helper function to join URL paths
function joinUrl(base, path) {
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!path.startsWith('/')) path = '/' + path;
    return base + path;
}

// Helper function to normalize paths
function normalizePath(path) {
    return path.toLowerCase().replace(/^\/+|\/+$/g, '');
}

// Debug logging function
function logDebug(type, ...args) {
    if (CONFIG.DEBUG) {
        const timestamp = new Date().toISOString();
        const prefix = `[${type}] ${timestamp}`;
        console.log(prefix, ...args);
    }
}

// Token management functions
function getTokens() {
    return {
        accessToken: localStorage.getItem(CONFIG.TOKEN_KEYS.ACCESS_TOKEN),
        refreshToken: localStorage.getItem(CONFIG.TOKEN_KEYS.REFRESH_TOKEN)
    };
}

function setTokens(accessToken, refreshToken) {
    if (accessToken) {
        localStorage.setItem(CONFIG.TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
        localStorage.setItem(CONFIG.TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    }
}

function clearTokens() {
    localStorage.removeItem(CONFIG.TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.TOKEN_KEYS.USER);
}

// Helper function for making API requests
async function makeApiRequest(endpoint, options = {}) {
    const url = joinUrl(CONFIG.BASE_URL, endpoint);
    const { accessToken, refreshToken } = getTokens();

    // Don't redirect to login page if we're already there
    const isLoginRequest = endpoint === CONFIG.ENDPOINTS.LOGIN;
    const isVerifyRequest = endpoint === CONFIG.ENDPOINTS.VERIFY;
    const isRefreshRequest = endpoint === CONFIG.ENDPOINTS.REFRESH;
    const currentPath = normalizePath(window.location.pathname);
    const isOnLoginPage = currentPath.includes('login') || currentPath === '';

    logDebug('API Request', {
        endpoint,
        url,
        method: options.method || 'GET',
        isLoginRequest,
        isVerifyRequest,
        isRefreshRequest,
        currentPath,
        isOnLoginPage,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken ? accessToken.length : 0,
        accessTokenStart: accessToken ? accessToken.substring(0, 10) : null,
        accessTokenEnd: accessToken ? accessToken.substring(accessToken.length - 10) : null,
        cookies: document.cookie
    });

    // For verify requests, ensure we're using the latest tokens
    const currentToken = isVerifyRequest ? getTokens().accessToken : accessToken;

    // Prepare headers
    const headers = {
        ...CONFIG.HEADERS,
        'X-Requested-With': 'XMLHttpRequest'
    };

    // Add Authorization header if we have a token
    if (currentToken) {
        const cleanToken = currentToken.trim();
        if (cleanToken && cleanToken.startsWith('ey')) {
            headers['Authorization'] = `Bearer ${cleanToken}`;
            logDebug('Adding Authorization header', {
                tokenLength: cleanToken.length,
                tokenStart: cleanToken.substring(0, 10),
                tokenEnd: cleanToken.substring(cleanToken.length - 10),
                headerValue: `Bearer ${cleanToken.substring(0, 10)}...${cleanToken.substring(cleanToken.length - 10)}`,
                hasRefreshToken: !!refreshToken,
                cookies: document.cookie
            });
        } else {
            logDebug('Invalid token format', {
                tokenLength: cleanToken ? cleanToken.length : 0,
                tokenStart: cleanToken ? cleanToken.substring(0, 10) : null,
                tokenEnd: cleanToken ? cleanToken.substring(cleanToken.length - 10) : null,
                isValidJWT: cleanToken ? cleanToken.split('.').length === 3 : false,
                hasRefreshToken: !!refreshToken
            });
            if (!isLoginRequest) {
                clearTokens();
                if (!isOnLoginPage) {
                    window.location.replace('/login.html');
                }
                throw new Error('Invalid token format');
            }
        }
    }

    const requestOptions = {
        ...CONFIG.REQUEST_OPTIONS,
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    };

    logDebug('Request Options', {
        method: requestOptions.method,
        headers: {
            ...requestOptions.headers,
            Authorization: requestOptions.headers.Authorization ? 
                `${requestOptions.headers.Authorization.substring(0, 20)}...${requestOptions.headers.Authorization.substring(requestOptions.headers.Authorization.length - 20)}` : 
                'none'
        },
        credentials: requestOptions.credentials,
        mode: requestOptions.mode,
        withCredentials: requestOptions.withCredentials,
        url,
        hasBody: !!requestOptions.body
    });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
        
        logDebug('Fetch Request', {
            url,
            method: requestOptions.method || 'GET',
            headers: {
                ...requestOptions.headers,
                Authorization: requestOptions.headers.Authorization ? 
                    `${requestOptions.headers.Authorization.substring(0, 20)}...${requestOptions.headers.Authorization.substring(requestOptions.headers.Authorization.length - 20)}` : 
                    'none'
            },
            credentials: requestOptions.credentials,
            mode: requestOptions.mode,
            withCredentials: requestOptions.withCredentials,
            cookies: document.cookie,
            hasBody: !!requestOptions.body
        });
        
        const response = await fetch(url, {
            ...requestOptions,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        logDebug('API Response', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url,
            cookies: document.cookie,
            responseType: response.type,
            responseMode: response.mode,
            responseCredentials: response.credentials
        });

        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            logDebug('Response Data', {
                hasData: !!data,
                dataKeys: data ? Object.keys(data) : [],
                status: response.status,
                url
            });
        } else {
            const text = await response.text();
            logDebug('Non-JSON Response', {
                contentType,
                textLength: text.length,
                status: response.status,
                url
            });
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { msg: text };
            }
        }
        
        if (response.status === 401) {
            logDebug('Unauthorized', {
                isOnLoginPage,
                isLoginRequest,
                isVerifyRequest,
                isRefreshRequest,
                hasAccessToken: !!currentToken,
                hasRefreshToken: !!refreshToken,
                tokenLength: currentToken ? currentToken.length : 0,
                tokenStart: currentToken ? currentToken.substring(0, 10) : null,
                tokenEnd: currentToken ? currentToken.substring(currentToken.length - 10) : null,
                authHeader: requestOptions.headers.Authorization ? 
                    `${requestOptions.headers.Authorization.substring(0, 20)}...${requestOptions.headers.Authorization.substring(requestOptions.headers.Authorization.length - 20)}` : 
                    'none',
                url,
                status: response.status,
                responseData: data,
                cookies: document.cookie
            });

            // Try to refresh token if we get 401 on verify
            if (isVerifyRequest && !isRefreshRequest && currentToken) {
                try {
                    logDebug('Attempting token refresh after verify failure', {
                        tokenLength: currentToken.length,
                        tokenStart: currentToken.substring(0, 10),
                        tokenEnd: currentToken.substring(currentToken.length - 10)
                    });

                    // Try to refresh the token
                    const refreshResponse = await makeApiRequest(CONFIG.ENDPOINTS.REFRESH, {
                        headers: {
                            ...CONFIG.HEADERS,
                            'Authorization': `Bearer ${currentToken}`
                        }
                    });

                    if (refreshResponse.accessToken) {
                        logDebug('Token refresh successful', {
                            newTokenLength: refreshResponse.accessToken.length,
                            newTokenStart: refreshResponse.accessToken.substring(0, 10),
                            newTokenEnd: refreshResponse.accessToken.substring(refreshResponse.accessToken.length - 10)
                        });

                        // Update token and retry the original request
                        setTokens(refreshResponse.accessToken);
                        return makeApiRequest(endpoint, options);
                    }
                } catch (refreshError) {
                    logDebug('Token refresh failed', {
                        error: refreshError.message,
                        stack: refreshError.stack
                    });
                }
            }
            
            // Only clear session if it's not a login request and we have a token
            if (!isLoginRequest && currentToken) {
                clearTokens();
                
                // Only redirect to login if we're not already there and this isn't a login/verify/refresh request
                if (!isOnLoginPage && !isLoginRequest && !isVerifyRequest && !isRefreshRequest) {
                    logDebug('Redirecting to login due to unauthorized access');
                    window.location.replace('/login.html');
                }
            }
            
            throw new Error(data.msg || 'Unauthorized access');
        }

        if (!response.ok) {
            logDebug('Response Error', {
                status: response.status,
                statusText: response.statusText,
                data,
                url,
                headers: Object.fromEntries(response.headers.entries())
            });
            throw new Error(data.msg || `HTTP error! status: ${response.status}`);
        }

        // If this is a successful login, update the session immediately
        if (isLoginRequest && data.accessToken) {
            const cleanToken = data.accessToken.trim();
            if (!cleanToken.startsWith('ey')) {
                logDebug('Invalid token format from server', {
                    tokenLength: cleanToken.length,
                    tokenStart: cleanToken.substring(0, 10),
                    tokenEnd: cleanToken.substring(cleanToken.length - 10),
                    isValidJWT: cleanToken.split('.').length === 3
                });
                throw new Error('Invalid token format received from server');
            }
            
            logDebug('Updating session after successful login', {
                hasAccessToken: !!cleanToken,
                hasUser: !!data.user,
                tokenLength: cleanToken.length,
                tokenStart: cleanToken.substring(0, 10),
                tokenEnd: cleanToken.substring(cleanToken.length - 10),
                url,
                cookies: document.cookie
            });

            // Store access token and user data
            setTokens(cleanToken);
            if (data.user) {
                localStorage.setItem(CONFIG.TOKEN_KEYS.USER, JSON.stringify(data.user));
            }
            
            // Return the cleaned data
            return {
                ...data,
                accessToken: cleanToken
            };
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            logDebug('Timeout Error', {
                error: error.message,
                url,
                timeout: CONFIG.API_TIMEOUT
            });
            throw new Error('Request timeout');
        }
        
        // Handle CORS errors
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            logDebug('CORS or Network Error', {
                url,
                error: error.message,
                origin: window.location.origin,
                cookies: document.cookie,
                headers: requestOptions.headers
            });
            
            throw new Error('Tidak dapat terhubung ke server. Mohon coba lagi nanti.');
        }
        
        // If it's a network error and we're not on login page, redirect to login
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            logDebug('Network Error', {
                isOnLoginPage,
                isLoginRequest,
                isVerifyRequest,
                isRefreshRequest,
                url,
                error: error.message,
                stack: error.stack,
                cookies: document.cookie
            });
            
            if (!isOnLoginPage && !isLoginRequest && !isVerifyRequest && !isRefreshRequest) {
                clearTokens();
                window.location.replace('/login.html');
            }
        }
        
        logDebug('API Error', {
            error: error.message,
            stack: error.stack,
            url,
            cookies: document.cookie,
            requestHeaders: requestOptions.headers
        });
        throw error;
    }
}

export { CONFIG, joinUrl, makeApiRequest, logDebug };