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

// Upload media blob or file directly to global permanent CDN
export const uploadMediaToCloud = async (fileOrBlob, fileName = 'media.mp4') => {
  try {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', fileOrBlob, fileName);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const url = await res.text();
      if (url && url.startsWith('http')) {
        return url.trim();
      }
    }
  } catch (err) {
    console.error('Global CDN upload error:', err);
  }
  return null;
};

