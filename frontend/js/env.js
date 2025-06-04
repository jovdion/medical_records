// Initialize environment variables
window._env_ = {
    // Default values
    API_URL: 'http://localhost:3000',
    // Add other environment variables here
};

// Function to update environment variables
function updateEnv(env) {
    window._env_ = { ...window._env_, ...env };
}

// Export for module usage
export { updateEnv }; 