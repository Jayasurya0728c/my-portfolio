// IndexedDB storage helper for large media files & portfolio data
const DB_NAME = 'PortfolioCMS_DB';
const STORE_NAME = 'cms_store';
const DATA_KEY = 'portfolio_cms_data';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const savePortfolioDataDB = async (data) => {
  // Try localStorage first for small text
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage quota exceeded (large video upload). Saving to IndexedDB...');
  }

  // Always save to IndexedDB for large media support
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, DATA_KEY);
    return true;
  } catch (err) {
    console.error('IndexedDB save error:', err);
    return false;
  }
};

export const loadPortfolioDataDB = async () => {
  // Try IndexedDB first (holds large video files)
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(DATA_KEY);
    const dbData = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
    if (dbData) return dbData;
  } catch (err) {
    console.warn('IndexedDB load fallback:', err);
  }

  // Fallback to localStorage
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return null;
};
