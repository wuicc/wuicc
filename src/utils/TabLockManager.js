/**
 * 标签页锁管理器
 * 用于确保同一应用在多个标签页中只有一个实例处于活动状态
 */
class TabLockManager {
  constructor() {
    // 日志控制开关
    this.LOG_ENABLED = false;
    
    // 生成唯一标签页ID
    this.tabId = this.generateUUID();
    this.log(`[TabLockManager] 初始化标签页管理器，标签页ID: ${this.tabId}`);
    
    // 锁状态
    this.isLocked = false;
    this.lockOwner = null;
    this.lockTimestamp = null;
    
    // 锁状态检查相关
    this.lockCheckTimeout = null;
    this.hasReceivedHeartbeat = false;
    
    // 回调函数
    this.onLockLostCallback = null;      // 锁丢失回调（被强制转移）
    this.onLockOccupiedCallback = null;  // 锁被占用回调（新增）
    
    // 创建BroadcastChannel进行标签页间通信
    this.channel = new BroadcastChannel('tab-lock-channel');
    this.log('[TabLockManager] 创建BroadcastChannel通信通道');
    
    // 监听来自其他标签页的消息
    this.channel.addEventListener('message', this.handleMessage.bind(this));
    
    // 监听页面卸载事件
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // 开始锁状态检查
    this.startLockCheck();
    
    // 开始2秒的锁状态监听
    this.startInitialLockCheck();
  }

  /**
   * 条件日志输出
   */
  log(message) {
    if (this.LOG_ENABLED) {
      console.log(message);
    }
  }

  /**
   * 生成UUID
   */
  generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * 处理来自其他标签页的消息
   */
  handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'lock_acquired':
        this.handleLockAcquired(data);
        break;
      case 'lock_released':
        this.handleLockReleased(data);
        break;
      case 'lock_force_transfer':
        this.handleLockForceTransfer(data);
        break;
      case 'lock_heartbeat':
        this.handleLockHeartbeat(data);
        break;
      default:
        break;
    }
  }

  /**
   * 处理锁被其他标签页获取
   */
  handleLockAcquired(data) {
    this.log(`[TabLockManager] 收到锁获取消息，来自标签页: ${data.tabId}`);
    
    if (this.isLocked && this.lockOwner === this.tabId) {
      // 当前标签页持有锁，但被其他标签页强制获取
      this.log(`[TabLockManager] 当前标签页锁被强制转移，释放锁`);
      this.releaseLock();
      if (this.onLockLostCallback) {
        this.log('[TabLockManager] 触发锁丢失回调');
        this.onLockLostCallback();
      }
    }
    this.lockOwner = data.tabId;
    this.isLocked = true;
    this.lockTimestamp = data.timestamp;
    this.log(`[TabLockManager] 锁状态更新 - 锁持有者: ${this.lockOwner}, 锁定状态: ${this.isLocked}`);
  }

  /**
   * 处理锁被释放
   */
  handleLockReleased(data) {
    this.log(`[TabLockManager] 收到锁释放消息，来自标签页: ${data.tabId}`);
    
    if (this.lockOwner === data.tabId) {
      this.lockOwner = null;
      this.isLocked = false;
      this.lockTimestamp = null;
      this.log(`[TabLockManager] 锁已释放，当前锁状态: ${this.isLocked}`);
    }
  }

  /**
   * 处理强制转移锁
   */
  handleLockForceTransfer(data) {
    this.log(`[TabLockManager] 收到强制转移锁消息，从 ${data.fromTabId} 转移到 ${data.toTabId}`);
    
    if (this.isLocked && this.lockOwner === this.tabId) {
      // 当前标签页的锁被强制转移
      this.log(`[TabLockManager] 当前标签页锁被强制转移，释放锁`);
      this.releaseLock();
      if (this.onLockLostCallback) {
        this.log('[TabLockManager] 触发锁丢失回调');
        this.onLockLostCallback();
      }
    }
  }

  /**
   * 处理心跳包
   */
  handleLockHeartbeat(data) {
    this.log(`[TabLockManager] 收到锁心跳包，锁持有者: ${data.tabId}, 时间戳: ${data.timestamp}`);
    
    // 如果是初始检查阶段，标记已收到心跳
    if (this.lockCheckTimeout && !this.hasReceivedHeartbeat) {
      this.log('[TabLockManager] 初始检查阶段收到心跳，标记锁被占用');
      this.hasReceivedHeartbeat = true;
      this.isLocked = true;
      this.lockOwner = data.tabId;
      this.lockTimestamp = data.timestamp;
      
      // 清除超时检查
      clearTimeout(this.lockCheckTimeout);
      this.lockCheckTimeout = null;

      // 触发锁被占用回调（新增）
      if (this.onLockOccupiedCallback) {
        this.log('[TabLockManager] 触发锁被占用回调');
        this.onLockOccupiedCallback();
      }
    }
    
    // 更新锁持有者的活跃状态
    if (this.lockOwner === data.tabId) {
      this.lockTimestamp = data.timestamp;
    }
  }

  /**
   * 开始初始锁状态检查（监听2秒）
   */
  startInitialLockCheck() {
    this.log('[TabLockManager] 开始2秒初始锁状态检查');
    
    // 重置心跳接收状态
    this.hasReceivedHeartbeat = false;
    
    // 设置2秒超时，如果没有收到心跳则继续正常流程
    this.lockCheckTimeout = setTimeout(() => {
      this.log('[TabLockManager] 2秒内未收到其他标签页心跳，继续正常流程');
      this.lockCheckTimeout = null;
    }, 2000);
  }

  /**
   * 获取锁状态
   */
  async getLockStatus() {
    const status = {
      locked: this.isLocked,
      tabId: this.lockOwner,
      timestamp: this.lockTimestamp
    };
    this.log(`[TabLockManager] 获取锁状态:`, status);
    return status;
  }

  /**
   * 尝试获取锁
   */
  async acquireLock() {
    this.log(`[TabLockManager] 尝试获取锁，当前锁状态: ${this.isLocked}, 锁持有者: ${this.lockOwner}`);
    
    // 等待初始检查完成（如果有正在进行的话）
    if (this.lockCheckTimeout) {
      this.log('[TabLockManager] 等待初始检查完成...');
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.lockCheckTimeout) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    
    if (!this.isLocked) {
      // 锁未被占用，获取锁
      this.isLocked = true;
      this.lockOwner = this.tabId;
      this.lockTimestamp = Date.now();
      this.log(`[TabLockManager] 成功获取锁，标签页ID: ${this.tabId}`);
      
      // 广播锁获取消息
      this.channel.postMessage({
        type: 'lock_acquired',
        data: {
          tabId: this.tabId,
          timestamp: this.lockTimestamp
        }
      });
      
      return true;
    }
    
    // 检查是否是当前标签页持有的锁
    if (this.lockOwner === this.tabId) {
      // 更新心跳时间
      this.lockTimestamp = Date.now();
      this.log(`[TabLockManager] 当前标签页已持有锁，更新心跳时间`);
      return true;
    }
    
    this.log(`[TabLockManager] 获取锁失败，锁已被其他标签页占用: ${this.lockOwner}`);
    
    // 获取锁失败时触发锁被占用回调（新增）
    if (this.onLockOccupiedCallback) {
      this.log('[TabLockManager] 触发锁被占用回调');
      this.onLockOccupiedCallback();
    }
    
    return false;
  }

  /**
   * 强制获取锁（转移锁到当前标签页）
   */
  async forceAcquireLock() {
    this.log(`[TabLockManager] 强制获取锁，当前锁持有者: ${this.lockOwner}`);
    
    // 广播强制转移消息
    this.channel.postMessage({
      type: 'lock_force_transfer',
      data: {
        fromTabId: this.lockOwner,
        toTabId: this.tabId,
        timestamp: Date.now()
      }
    });
    
    // 获取锁
    this.isLocked = true;
    this.lockOwner = this.tabId;
    this.lockTimestamp = Date.now();
    this.log(`[TabLockManager] 强制获取锁成功，新锁持有者: ${this.tabId}`);
    
    // 广播锁获取消息
    this.channel.postMessage({
      type: 'lock_acquired',
      data: {
        tabId: this.tabId,
        timestamp: this.lockTimestamp
      }
    });
    
    return true;
  }

  /**
   * 释放锁
   */
  releaseLock() {
    if (this.isLocked && this.lockOwner === this.tabId) {
      this.log(`[TabLockManager] 释放锁，标签页ID: ${this.tabId}`);
      this.isLocked = false;
      this.lockOwner = null;
      this.lockTimestamp = null;
      
      // 广播锁释放消息
      this.channel.postMessage({
        type: 'lock_released',
        data: {
          tabId: this.tabId,
          timestamp: Date.now()
        }
      });
    } else {
      this.log(`[TabLockManager] 无需释放锁，当前锁状态: ${this.isLocked}, 锁持有者: ${this.lockOwner}`);
    }
  }

  /**
   * 发送心跳包
   */
  sendHeartbeat() {
    if (this.isLocked && this.lockOwner === this.tabId) {
      this.log(`[TabLockManager] 发送锁心跳包，标签页ID: ${this.tabId}`);
      this.channel.postMessage({
        type: 'lock_heartbeat',
        data: {
          tabId: this.tabId,
          timestamp: Date.now()
        }
      });
    }
  }

  /**
   * 开始锁状态检查
   */
  startLockCheck() {
    // 每1秒发送一次心跳包
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 1000);
    
    // 每10秒检查一次锁状态
    this.lockCheckInterval = setInterval(() => {
      this.checkLockValidity();
    }, 10000);
  }

  /**
   * 检查锁有效性
   */
  checkLockValidity() {
    if (this.isLocked && this.lockOwner !== this.tabId) {
      // 检查锁是否过期（30秒无心跳视为过期）
      const now = Date.now();
      const timeDiff = now - this.lockTimestamp;
      this.log(`[TabLockManager] 检查锁有效性，时间差: ${timeDiff}ms`);
      
      if (timeDiff > 30000) {
        // 锁已过期，自动获取锁
        this.log(`[TabLockManager] 锁已过期，自动强制获取锁`);
        this.forceAcquireLock();
      }
    }
  }

  /**
   * 处理页面卸载
   */
  handleBeforeUnload() {
    this.log(`[TabLockManager] 页面即将卸载，释放锁资源`);
    this.releaseLock();
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.log(`[TabLockManager] 销毁管理器，清理资源`);
    this.releaseLock();
    
    // 清理初始检查超时
    if (this.lockCheckTimeout) {
      clearTimeout(this.lockCheckTimeout);
      this.log('[TabLockManager] 清理初始检查超时');
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.log('[TabLockManager] 清理心跳定时器');
    }
    
    if (this.lockCheckInterval) {
      clearInterval(this.lockCheckInterval);
      this.log('[TabLockManager] 清理锁检查定时器');
    }
    
    this.channel.close();
    this.log('[TabLockManager] 关闭BroadcastChannel');
  }
}

export default TabLockManager;