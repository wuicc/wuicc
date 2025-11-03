export class IndexedDBManager {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // 创建存储所有游戏数据的对象存储
        if (!db.objectStoreNames.contains('games')) {
          db.createObjectStore('games', { keyPath: 'gameId' });
        }
      };
    });
  }

  async getGameData(gameId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['games'], 'readonly');
      const store = transaction.objectStore('games');
      const request = store.get(gameId);

      request.onsuccess = () => resolve(request.result || { gameId, gachaTypes: {} });
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async saveGameData(gameData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['games'], 'readwrite');
      const store = transaction.objectStore('games');
      const request = store.put(gameData);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  // 新增的 setGameData 方法
  async setGameData(gameId, data) {
    const gameData = await this.getGameData(gameId);
    const updatedData = { ...gameData, ...data };
    return this.saveGameData(updatedData);
  }

  async addGachaRecord(gameId, gachaTypeId, record) {
    const gameData = await this.getGameData(gameId);

    if (!gameData.gachaTypes[gachaTypeId]) {
      gameData.gachaTypes[gachaTypeId] = [];
    }

    gameData.gachaTypes[gachaTypeId].push({
      ...record,
      id: Date.now() + Math.random().toString(36).substr(2, 9)
    });

    await this.saveGameData(gameData);
  }

  async getGachaRecords(gameId, gachaTypeId) {
    const gameData = await this.getGameData(gameId);
    return gameData.gachaTypes[gachaTypeId] || [];
  }

  async getAllGachaRecords(gameId) {
    const gameData = await this.getGameData(gameId);
    return Object.values(gameData.gachaTypes).flat();
  }

  async clearGachaTypeRecords(tableName, gachaType) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['games'], 'readwrite');
      const store = transaction.objectStore('games');
      const request = store.get(tableName);

      request.onsuccess = () => {
        const gameData = request.result || { gameId: tableName, gachaTypes: {} };

        if (gameData.gachaTypes[gachaType]) {
          delete gameData.gachaTypes[gachaType];
          const putRequest = store.put(gameData);

          putRequest.onsuccess = () => resolve();
          putRequest.onerror = (event) => reject(event.target.error);
        } else {
          resolve();
        }
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // 删除指定游戏和UID的所有记录
  async deleteAllGameRecords(gameId, uid) {
    return new Promise((resolve, reject) => {
      const tableName = `${gameId}-${uid}`;
      const transaction = this.db.transaction(['games'], 'readwrite');
      const store = transaction.objectStore('games');
      const request = store.delete(tableName);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
}