import { defineStore } from 'pinia'
import axios from 'axios'
import { getApiUrl } from '@/utils/apiEndpoints'
import StorageManager from '@/utils/StorageManager'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: {
      id: null,
      username: '',
      nickname: '',
      avatar: '',
      settings_metadata: null
    },
    isLoggedIn: false,
    isLoading: false
  }),

  actions: {
    // 设置用户信息
    setUser(userData) {
      this.user = {
        id: userData.id,
        username: userData.username,
        nickname: userData.nickname,
        avatar: userData.avatar,
        settings_metadata: userData.settings_metadata
      }
      this.isLoggedIn = !!userData.id
    },

    // 清除用户信息
    clearUser() {
      this.user = {
        id: null,
        username: '',
        nickname: '',
        avatar: '',
        settings_metadata: null
      }
      this.isLoggedIn = false
    },

    // 更新用户信息
    updateUserField(field, value) {
      if (this.user.hasOwnProperty(field)) {
        this.user[field] = value
      }
    },

    // 设置加载状态
    setLoading(loading) {
      this.isLoading = loading
    },

    // 从API获取用户信息并更新store
    async fetchUserProfileFromAPI(toast, t) {
      this.setLoading(true)
      try {
        const token = StorageManager.get('auth_token')
        if (!token) {
          this.setLoading(false)
          return false
        }

        const response = await axios.get(getApiUrl('USER_PROFILE'), {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.data.code === 200) {
          const userData = {
            id: response.data.data.user_id,
            username: response.data.data.username,
            nickname: response.data.data.nickname,
            avatar: response.data.data.avatar,
            settings_metadata: response.data.data.settings_metadata
          }

          // 将用户ID保存到本地存储
          StorageManager.set('user_id', userData.id)
          
          // 直接更新store中的用户信息，确保数据正确保存
          this.user = {
            id: userData.id,
            username: userData.username,
            nickname: userData.nickname,
            avatar: userData.avatar,
            settings_metadata: userData.settings_metadata
          }
          this.isLoggedIn = !!userData.id
          
          return true
        } else {
          // 处理各种错误情况
          handleAuthError(response.data.error_code, response.data.message, toast, t)
          return false
        }
      } catch (error) {
        console.error('Fetch user profile error:', error)
        if (error.response?.data?.error_code) {
          handleAuthError(
            error.response.data.error_code,
            error.response.data.message,
            toast,
            t
          )
        } else if (toast && t) {
          toast.showToast(t('app.settings.account.loginFailed'), 'error')
        }
        throw error
      } finally {
        this.setLoading(false)
      }
    }
  },

  getters: {
    // 获取用户初始s
    userInitial: (state) => {
      if (state.user.nickname) {
        return state.user.nickname.charAt(0).toUpperCase()
      }
      if (state.user.username) {
        return state.user.username.charAt(0).toUpperCase()
      }
      return 'U'
    }
  }
})

// 用于获取用户信息的工具函数
// 注意：这个函数不在store内部，以保持store只负责存储逻辑

export const fetchUserProfile = async (toast, t) => {
  const authStore = useAuthStore()
  return await authStore.fetchUserProfileFromAPI(toast, t)
}

// 处理认证错误
export const handleAuthError = (errorCode, message, toast, t) => {
  // 清除无效的token
  StorageManager.remove('auth_token')
  StorageManager.remove('user_id')
  
  if (!toast || !t) return
  
  switch (errorCode) {
    case 200003: // INVALID_TOKEN
    case 200017: // TOKEN_EXPIRED
      toast.showToast(t('app.settings.account.loginFailed'), 'error')
      break
    case 200012: // ACCOUNT_BANNED
      toast.showToast(
        message || t('app.settings.account.accountBanned'),
        'error'
      )
      break
    case 200011: // NOT_ACTIVATED
      toast.showToast(
        message || t('app.settings.account.accountNotActivated'),
        'error'
      )
      break
    default:
      toast.showToast(message || t('app.settings.account.loginFailed'), 'error')
  }
}