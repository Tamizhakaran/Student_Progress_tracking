export const getMediaURL = (path) => {
    if (!path || path === 'no-photo.jpg' || path.endsWith('no-photo.jpg')) return null;

    if (path.startsWith('data:')) return path;

    // Check both standard prefixes for Vite and Create React App
    const baseUrl = process.env.REACT_APP_API_URL || 
                    import.meta.env?.VITE_API_URL || 
                    "https://student-progress-tracking.onrender.com";
    
    const API_URL = baseUrl.replace(/\/$/, "");

    // If it's an absolute URL
    if (path.startsWith('http')) {
        // If it points to an old/local domain, fix it to use the current API_URL
        if (path.includes('localhost') || path.includes('127.0.0.1')) {
             const parts = path.split('/');
             const fileName = parts.pop();
             if (path.includes('/uploads/')) {
                 const uploadIndex = parts.indexOf('uploads');
                 const relativePath = parts.slice(uploadIndex).join('/');
                 return `${API_URL}/${relativePath}/${fileName}`;
             }
             return `${API_URL}/uploads/${fileName}`;
        }
        return path;
    }

    // If it's a relative path starting with /
    if (path.startsWith('/')) {
        return `${API_URL}${path}`;
    }

    // Standard relative path
    return `${API_URL}/${path}`;
};
