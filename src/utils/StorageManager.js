class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'wuicc-front-app-data';
    this.eventTarget = new EventTarget();
    this.migrateOldData();
  }

  // 迁移旧数据到统一存储
  migrateOldData() {
    const oldKeys = [
      'userLanguage', 'serverTimezone', 'useLocalTimezone', 'theme',
      'timeline-time-format', 'activityStatus', 'userGameSelections',
      'gameList', 'auth_token'
    ];
    const currentData = this.getAllData();
    let needsUpdate = false;

    oldKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          currentData[key] = JSON.parse(value);
        } catch {
          currentData[key] = value;
        }
        localStorage.removeItem(key);
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      this.saveAllData(currentData);
    }
  }

  getAllData() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  saveAllData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  get(key) {
    return this.getAllData()[key];
  }

  set(key, value) {
    const data = this.getAllData();
    data[key] = value;
    
    // 当更新activityStatus时，记录最后写入时间
    if (key === 'activityStatus') {
      data['activityStatusLastUpdated'] = new Date().toLocaleString();
    }
    
    this.saveAllData(data);
    this.eventTarget.dispatchEvent(new CustomEvent('storageChange', {
      detail: { key, value }
    }));
  }

  remove(key) {
    const data = this.getAllData();
    delete data[key];
    this.saveAllData(data);
  }

  onStorageChange(callback) {
    this.eventTarget.addEventListener('storageChange', (e) => callback(e.detail));
  }
}

// 导出单例实例
export default new StorageManager();