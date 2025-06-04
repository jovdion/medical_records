// Initialize environment variables
window._env_ = {
    // API URL for the backend
    API_URL: 'https://medical-records-be-913201672104.us-central1.run.app',
    // Default values
    // Add other environment variables here
};

// Function to update environment variables
function updateEnv(env) {
    window._env_ = { ...window._env_, ...env };
}

// Export for module usage
export { updateEnv }; 