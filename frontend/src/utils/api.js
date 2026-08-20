// Utility function to make authenticated API requests
export const apiFetch = async (url, options = {}) => {
    // 1. Get the token from sessionStorage
    const token = sessionStorage.getItem('token');

    // 2. Setup the headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 3. Attach the token if it exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 4. Make the fetch request
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // 5. Handle global 401 Unauthorized errors (session expired or invalid)
    if (response.status === 401) {
        console.error('Session expired or invalid token. Forcing logout.');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('isLoggedIn');
        window.location.reload(); // Force a reload to trigger the login screen in App.jsx
        throw new Error('Unauthorized');
    }

    return response;
};
