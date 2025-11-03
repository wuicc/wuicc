export class ActivitiesManager {
  constructor(dbName = 'GenshinActivitiesDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async initDB() {
    try {
      await this.openDB();
      return true;
    } catch (error) {
      console.error('初始化活动数据库失败:', error);
      return false;
    }
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // 创建存储所有活动数据的对象存储
        if (!db.objectStoreNames.contains('activities')) {
          db.createObjectStore('activities', { keyPath: 'activityId' });
        }
        // 创建存储元数据的对象存储
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' });
        }
      };
    });
  }

  async saveMetadata(metadata) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({
        id: 'activities_metadata',
        ...metadata,
        updatedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getMetadata() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get('activities_metadata');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async saveActivity(activityId, activityData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');
      const request = store.put({
        activityId,
        data: activityData,
        updatedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getActivity(activityId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['activities'], 'readonly');
      const store = transaction.objectStore('activities');
      const request = store.get(activityId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getAllActivities() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['activities'], 'readonly');
      const store = transaction.objectStore('activities');
      const request = store.getAll();

      request.onsuccess = () => {
        const activities = {};
        request.result.forEach(item => {
          activities[item.activityId] = item.data;
        });
        resolve(activities);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async deleteAllActivities() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['activities', 'metadata'], 'readwrite');
      
      // 清空activities存储
      const activitiesStore = transaction.objectStore('activities');
      const activitiesClearRequest = activitiesStore.clear();
      
      // 删除metadata
      const metadataStore = transaction.objectStore('metadata');
      const metadataDeleteRequest = metadataStore.delete('activities_metadata');

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  }

  async importActivitiesData(metadataData, activitiesData) {
    try {
      // 先保存元数据
      await this.saveMetadata(metadataData);
      
      // 保存每个活动的数据
      const savePromises = [];
      
      // 如果activitiesData是完整的API响应格式，提取data部分
      let activitiesToProcess = activitiesData;
      if (activitiesData.data && typeof activitiesData.data === 'object') {
        activitiesToProcess = activitiesData.data;
      }
      
      // 只处理data.activities数组中的活动，忽略其他活动数据
      if (activitiesToProcess.activities && Array.isArray(activitiesToProcess.activities)) {
        activitiesToProcess.activities.forEach(activityItem => {
          Object.entries(activityItem).forEach(([activityId, data]) => {
            // 跳过game_version等非活动数据，只处理活动对象
            if (activityId !== 'game_version' && typeof data === 'object' && data !== null) {
              savePromises.push(this.saveActivity(activityId, data));
            }
          });
        });
      }
      
      // 等待所有保存操作完成
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }
      
      return true;
    } catch (error) {
      console.error('导入活动数据失败:', error);
      return false;
    }
  }

  async hasData() {
    try {
      const metadata = await this.getMetadata();
      const activities = await this.getAllActivities();
      return metadata !== null && Object.keys(activities).length > 0;
    } catch (error) {
      console.error('检查数据存在性失败:', error);
      return false;
    }
  }
}