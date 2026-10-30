import axios from 'axios';

// Detect API base URL dynamically:
// 1. Explicit VITE_API_URL environment variable if set
// 2. Production browser:
//    - If running under /ats (e.g. jobbycart.com/ats), use /ats/api
//    - If running on root or subdomain (e.g. ats.jobbycart.com), use /api
// 3. Localhost fallback: http://localhost:8000/api
export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}${window.location.pathname.startsWith('/ats') ? '/ats' : ''}/api`
    : 'http://localhost:8000/api'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

export const getDownloadUrl = (path) => {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  let fullUrl = (cleanBase.endsWith('/api') && cleanPath.startsWith('api/'))
    ? `${cleanBase}/${cleanPath.slice(4)}`
    : `${cleanBase}/${cleanPath}`;

  const token = localStorage.getItem('inymart_token');
  if (token && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }
  return fullUrl;
};

/**
 * Downloads a resume file safely via authenticated Axios blob request.
 * Automatically saves the file with original name and cleans up object URLs.
 */
export const downloadResumeFile = async (resumeId, defaultFilename = 'resume.pdf') => {
  try {
    const response = await api.get(`/resumes/${resumeId}/download`, {
      responseType: 'blob',
    });

    let filename = defaultFilename;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim();
      }
    }

    const mime = response.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: mime });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    return { success: true, filename };
  } catch (err) {
    console.error('Resume download error:', err);
    let message = 'Failed to download resume file.';
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        if (json.message) message = json.message;
      } catch (_) {}
    } else if (err.response?.data?.message) {
      message = err.response.data.message;
    }
    throw new Error(message);
  }
};

/**
 * Fetches resume preview blob for inline viewing (e.g. PDF iframe/embed).
 */
export const fetchResumeBlob = async (resumeId) => {
  const response = await api.get(`/resumes/${resumeId}/preview`, {
    responseType: 'blob',
  });

  const mime = response.headers['content-type'] || 'application/pdf';
  const blob = new Blob([response.data], { type: mime });
  const blobUrl = window.URL.createObjectURL(blob);

  let filename = 'resume.pdf';
  const disposition = response.headers['content-disposition'];
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '').trim();
    }
  }

  return {
    blobUrl,
    mime,
    filename,
    revoke: () => window.URL.revokeObjectURL(blobUrl),
  };
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('inymart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Prevent aggressive LiteSpeed/browser caching of GET responses
  if (config.method === 'get') {
    config.params = {
      ...(config.params || {}),
      _t: Date.now(),
    };
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('inymart_token');
      localStorage.removeItem('inymart_user');
      const loginPath = window.location.pathname.startsWith('/ats') ? '/ats/login' : '/login';
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
