// Auth storage constants
const AUTH_STORAGE_KEY = 'authData';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// List of authorized user hashes (all in lowercase)
const authorizedHashes = [
    "ebf453b51f6e7d0ddcbdf00dc9f1fa704dd79f4c38d8df18457610b16e1c633a"
    // Add more authorized hashes here
];

// Check if stored authentication is valid
function isAuthValid() {
    try {
        const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!storedAuth) return false;

        const authData = JSON.parse(storedAuth);
        const currentTime = Date.now();

        // Check if auth is expired or invalid
        if (!authData.hash || !authData.expiresAt || currentTime > authData.expiresAt) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            return false;
        }

        // Convert stored hash to lowercase for case-insensitive comparison
        const storedHash = authData.hash.toLowerCase();

        // Check if hash is still authorized
        return authorizedHashes.includes(storedHash);
    } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return false;
    }
}

// Store authentication data with expiration
function storeAuthData(hash) {
    const authData = {
        hash: hash.toLowerCase(), // Store hash in lowercase
        expiresAt: Date.now() + THIRTY_DAYS_MS
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}