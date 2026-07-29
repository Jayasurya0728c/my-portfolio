// Live Cloud Synchronization Engine for multi-device portfolio sync
const CLOUD_OBJECT_ID = 'ff8081819f7e10ae019fae73db4e44a4';
const CLOUD_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export const fetchCloudPortfolioData = async () => {
  try {
    const res = await fetch(CLOUD_URL);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.portfolioData) {
        return json.data.portfolioData;
      }
    }
  } catch (err) {
    console.warn('Cloud data fetch fallback:', err);
  }
  return null;
};

export const saveCloudPortfolioData = async (data) => {
  try {
    const res = await fetch(CLOUD_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jayasurya_Portfolio_Live_Data',
        data: { portfolioData: data, updatedAt: new Date().toISOString() }
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Cloud sync error:', err);
    return false;
  }
};
