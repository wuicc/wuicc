class LanguageStorageManager {
  constructor() {
    this.baseLanguagePath = '/src/locales/';
    this.languageUpdateCheckKey = 'language_update_timestamps';
    this.languageUpdateInterval = 7 * 24 * 60 * 60 * 1000; // 7天检查一次更新
  }

  /**
   * 下载语言文件
   * @param {string} locale - 语言代码
   * @returns {Promise<Object>} 语言数据
   */
  async downloadLanguageFile(locale) {
    try {
      const response = await import(`../locales/${locale}.json`);
      const languageData = response.default;
      
      // 存储语言文件
      this.saveLanguageFile(locale, languageData);
      
      // 更新最后更新时间
      this.updateLastCheckTime(locale);
      
      return languageData;
    } catch (error) {
      console.error(`Failed to download language file for ${locale}:`, error);
      throw error;
    }
  }

  /**
   * 保存语言文件到localStorage
   * @param {string} locale - 语言代码
   * @param {Object} languageData - 语言数据
   */
  saveLanguageFile(locale, languageData) {
    const storageKey = this.getLanguageStorageKey(locale);
    localStorage.setItem(storageKey, JSON.stringify(languageData));
  }

  /**
   * 从localStorage获取语言文件
   * @param {string} locale - 语言代码
   * @returns {Object|null} 语言数据，如果不存在则返回null
   */
  getLanguageFile(locale) {
    const storageKey = this.getLanguageStorageKey(locale);
    const storedData = localStorage.getItem(storageKey);
    return storedData ? JSON.parse(storedData) : null;
  }

  /**
   * 检查语言文件是否需要更新
   * @param {string} locale - 语言代码
   * @returns {boolean} 是否需要更新
   */
  shouldUpdateLanguageFile(locale) {
    const lastCheckTime = this.getLastCheckTime(locale);
    const currentTime = Date.now();
    return currentTime - lastCheckTime > this.languageUpdateInterval;
  }

  /**
   * 获取语言文件的localStorage键名
   * @param {string} locale - 语言代码
   * @returns {string} 存储键名
   */
  getLanguageStorageKey(locale) {
    return `wuicc_language_${locale}`;
  }

  /**
   * 获取语言最后检查更新的时间
   * @param {string} locale - 语言代码
   * @returns {number} 时间戳
   */
  getLastCheckTime(locale) {
    const timestamps = this.getAllUpdateTimestamps();
    return timestamps[locale] || 0;
  }

  /**
   * 更新语言检查时间
   * @param {string} locale - 语言代码
   */
  updateLastCheckTime(locale) {
    const timestamps = this.getAllUpdateTimestamps();
    timestamps[locale] = Date.now();
    localStorage.setItem(this.languageUpdateCheckKey, JSON.stringify(timestamps));
  }

  /**
   * 获取所有语言的更新时间戳
   * @returns {Object} 时间戳对象
   */
  getAllUpdateTimestamps() {
    const stored = localStorage.getItem(this.languageUpdateCheckKey);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * 清除语言文件缓存
   * @param {string} locale - 语言代码，如果为null则清除所有
   */
  clearLanguageCache(locale = null) {
    if (locale) {
      const storageKey = this.getLanguageStorageKey(locale);
      localStorage.removeItem(storageKey);
      
      const timestamps = this.getAllUpdateTimestamps();
      delete timestamps[locale];
      localStorage.setItem(this.languageUpdateCheckKey, JSON.stringify(timestamps));
    } else {
      // 清除所有语言缓存
      const availableLanguages = ['zh-Hans', 'zh-Hant', 'ja', 'ko', 'fr'];
      availableLanguages.forEach(lang => {
        const storageKey = this.getLanguageStorageKey(lang);
        localStorage.removeItem(storageKey);
      });
      localStorage.removeItem(this.languageUpdateCheckKey);
    }
  }

  /**
   * 获取语言文件，如果需要更新则下载最新版本
   * @param {string} locale - 语言代码
   * @returns {Promise<Object>} 语言数据
   */
  async getOrDownloadLanguageFile(locale) {
    // 首先尝试从本地获取
    let languageData = this.getLanguageFile(locale);
    
    // 如果本地没有或者需要更新，则下载
    if (!languageData || this.shouldUpdateLanguageFile(locale)) {
      try {
        languageData = await this.downloadLanguageFile(locale);
      } catch (error) {
        // 如果下载失败，但本地有缓存，则使用缓存
        if (!languageData) {
          throw new Error(`Failed to get language file for ${locale}`);
        }
      }
    }
    
    return languageData;
  }
}

// 导出单例实例
export default new LanguageStorageManager();