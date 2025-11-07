class LanguageStorageManager {
  constructor() {
    this.baseLanguagePath = '/src/locales/';
    this.languageTimestampKey = 'language_cache_timestamps'; // 合并的时间戳键名
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

      // 更新语言时间戳
      this.updateLanguageTimestamp(locale);

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

    // 保存语言文件的时间戳
    this.updateLanguageTimestamp(locale);
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
   * 检查语言文件是否需要更新（基于时间间隔）
   * @param {string} locale - 语言代码
   * @returns {boolean} 是否需要更新
   */
  shouldUpdateLanguageFile(locale) {
    const lastUpdateTime = this.getLanguageTimestamp(locale);
    const currentTime = Date.now();
    return currentTime - lastUpdateTime > this.languageUpdateInterval;
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
   * 获取语言时间戳（用于检查更新间隔和文件是否过时）
   * @param {string} locale - 语言代码
   * @returns {number} 时间戳
   */
  getLanguageTimestamp(locale) {
    const timestamps = this.getAllLanguageTimestamps();
    return timestamps[locale] || 0;
  }

  /**
   * 更新语言时间戳
   * @param {string} locale - 语言代码
   */
  updateLanguageTimestamp(locale) {
    const timestamps = this.getAllLanguageTimestamps();
    // 如果有服务器提供的更新时间，则使用服务器时间，否则使用当前时间
    timestamps[locale] = window.languageLastModified?.[locale] || Date.now();
    localStorage.setItem(this.languageTimestampKey, JSON.stringify(timestamps));
  }

  /**
   * 获取所有语言的时间戳
   * @returns {Object} 时间戳对象
   */
  getAllLanguageTimestamps() {
    const stored = localStorage.getItem(this.languageTimestampKey);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * 检查语言文件是否过时（基于服务器时间戳比较）
   * @param {string} locale - 语言代码
   * @returns {boolean} 是否过时
   */
  isLanguageFileOutdated(locale) {
    // 如果没有服务器提供的更新时间，则不进行比较
    if (!window.languageLastModified || typeof window.languageLastModified[locale] === 'undefined') {
      return false;
    }

    const serverTimestamp = window.languageLastModified[locale];
    const localTimestamp = this.getLanguageTimestamp(locale);
    if (localTimestamp === 0) {
      return false;
    }

    // 如果服务器时间戳大于本地时间戳，则文件已过时
    // console.log(`Server timestamp: ${serverTimestamp}, Local timestamp: ${localTimestamp}`);
    return serverTimestamp > localTimestamp;
  }

  /**
   * 清除语言文件缓存
   * @param {string} locale - 语言代码，如果为null则清除所有
   */
  clearLanguageCache(locale = null) {
    if (locale) {
      const storageKey = this.getLanguageStorageKey(locale);
      localStorage.removeItem(storageKey);

      // 清除语言时间戳
      const timestamps = this.getAllLanguageTimestamps();
      delete timestamps[locale];
      localStorage.setItem(this.languageTimestampKey, JSON.stringify(timestamps));
    } else {
      // 清除所有语言缓存
      const availableLanguages = ['zh-Hans', 'zh-Hant', 'ja', 'ko', 'fr'];
      availableLanguages.forEach(lang => {
        const storageKey = this.getLanguageStorageKey(lang);
        localStorage.removeItem(storageKey);
      });
      localStorage.removeItem(this.languageTimestampKey);
    }
  }

  /**
   * 获取语言文件，如果需要更新则下载最新版本
   * @param {string} locale - 语言代码
   * @returns {Promise<Object>} 语言数据
   */
  async getOrDownloadLanguageFile(locale) {
    // 首先检查语言文件是否过时，如果过时则清除缓存
    if (this.isLanguageFileOutdated(locale)) {
      console.log(`Language file for ${locale} is outdated, clearing cache`);
      this.clearLanguageCache(locale);
    }

    // 尝试从本地获取
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