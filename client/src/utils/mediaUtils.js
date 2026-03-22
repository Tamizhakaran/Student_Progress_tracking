export const getMediaURL = (path) => {
    if (!path || path === 'no-photo.jpg' || path.endsWith('no-photo.jpg')) return null;

    const API_URL = (process.env.REACT_APP_API_URL || "https://student-progress-tracking.onrender.com").replace(/\/$/, "");

    // If it's an absolute URL
    if (path.startsWith('http')) {
        // If it points to an old/local domain, fix it to use the current API_URL
        if (path.includes('localhost') || path.includes('127.0.0.1')) {
             const parts = path.split('/');
             const fileName = parts.pop();
             // Often stored as http://localhost:5000/uploads/students/file.jpg
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
