const LATEST_JSON_URL_KEY = 'portfolio_latest_cloud_json_url';

export const fetchCloudPortfolioData = async () => {
  try {
    const cloudUrl = localStorage.getItem(LATEST_JSON_URL_KEY);
    if (cloudUrl && cloudUrl.startsWith('http')) {
      const res = await fetch(cloudUrl);
      if (res.ok) {
        const json = await res.json();
        if (json && json.projects) return json;
      }
    }
  } catch (err) {
    console.warn('Cloud data fetch fallback:', err);
  }
  return null;
};

export const saveCloudPortfolioData = async (data) => {
  try {
    const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const cloudUrl = await uploadMediaToCloud(jsonBlob, 'portfolio.json');
    if (cloudUrl) {
      localStorage.setItem(LATEST_JSON_URL_KEY, cloudUrl);
      return true;
    }
  } catch (err) {
    console.error('Cloud JSON sync error:', err);
  }
  return false;
};

// 1. Helper to upload to Vercel serverless proxy (for small files under 4.5MB)
const uploadToVercelProxy = (fileOrBlob, fileName, onProgress) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.setRequestHeader('File-Name', fileName);
    xhr.setRequestHeader('Content-Type', fileOrBlob.type || 'application/octet-stream');

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json.url || null);
        } catch (e) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);
    xhr.send(fileOrBlob);
  });
};

// 2. Helper to upload directly to Pixeldrain (supports files up to 20GB, CORS enabled)
const uploadToPixeldrain = (fileOrBlob, fileName, onProgress) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://pixeldrain.com/api/file', true);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json && json.success && json.id) {
            resolve(`https://pixeldrain.com/api/file/${json.id}`);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);

    const formData = new FormData();
    formData.append('file', fileOrBlob, fileName);
    xhr.send(formData);
  });
};

// 3. Helper to upload directly to Catbox.moe
const uploadToDirectCatbox = (fileOrBlob, fileName, onProgress) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://catbox.moe/user/api.php', true);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const url = xhr.responseText.trim();
        if (url && url.startsWith('http')) {
          resolve(url);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', fileOrBlob, fileName);
    xhr.send(formData);
  });
};

const uploadToLocalFolder = (fileOrBlob, fileName, onProgress) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-local', true);
    xhr.setRequestHeader('File-Name', fileName);
    xhr.setRequestHeader('Content-Type', fileOrBlob.type || 'application/octet-stream');

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json.url || null);
        } catch (e) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);
    xhr.send(fileOrBlob);
  });
};

// Main media upload coordinator with multi-CDN fallback
export const uploadMediaToCloud = async (fileOrBlob, fileName = 'media.mp4', onProgress = null) => {
  // If running locally, save directly to the local public/screenshots directory
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
      const url = await uploadToLocalFolder(fileOrBlob, fileName, onProgress);
      if (url) return url;
    } catch (e) {
      console.warn('Local file write failed, falling back to Vercel/cloud:', e);
    }
  }

  // Try Vercel proxy first if file is small (under 4.19MB to stay under Vercel Gateway's 4.5MB boundary)
  if (fileOrBlob.size < 4.19 * 1024 * 1024) {
    try {
      const url = await uploadToVercelProxy(fileOrBlob, fileName, onProgress);
      if (url) return url;
    } catch (e) {
      console.warn('Vercel proxy upload failed:', e);
    }
  }

  // Fallback to Pixeldrain (highly stable, CORS enabled, up to 20GB size limit)
  try {
    const url = await uploadToPixeldrain(fileOrBlob, fileName, onProgress);
    if (url) return url;
  } catch (e) {
    console.warn('Pixeldrain upload failed:', e);
  }

  // Fallback to Direct Catbox (if CORS is allowed on user browser)
  try {
    const url = await uploadToDirectCatbox(fileOrBlob, fileName, onProgress);
    if (url) return url;
  } catch (e) {
    console.warn('Direct Catbox upload failed:', e);
  }

  return null;
};

